import Anthropic from '@anthropic-ai/sdk';
import type { Order, DailyTransits, ReadingJSON } from '@/types';
import { buildDailyReadingPrompt } from './buildPrompt';
import { logger } from '@/lib/logger';

const client = new Anthropic();

const MAX_RETRIES = 3;
const BASE_DELAY  = 1000; // 1 second

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callClaude(system: string, user: string): Promise<string> {
  const response = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 1000,
    system,
    messages:   [{ role: 'user', content: user }],
  });

  const raw = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  return raw.replace(/```json|```/g, '').trim();
}

export async function generateDailyReading(
  order:       Order,
  transits:    DailyTransits,
  readingDate: string
): Promise<ReadingJSON> {
  const { system, user } = buildDailyReadingPrompt(order, transits, readingDate);

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const clean = await callClaude(system, user);

      let parsed: ReadingJSON;
      try {
        parsed = JSON.parse(clean) as ReadingJSON;
      } catch {
        throw new Error(`Invalid JSON from Claude (attempt ${attempt}): ${clean.slice(0, 200)}`);
      }

      // Validate required fields
      if (!parsed.greeting || !parsed.body || !parsed.key_insight || !Array.isArray(parsed.tags) || !parsed.dominant_theme) {
        throw new Error(`Claude response missing required fields (attempt ${attempt})`);
      }

      if (attempt > 1) {
        logger.info({ msg: 'Claude succeeded after retry', attempt, orderId: order.id });
      }

      return parsed;

    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      logger.warn({
        msg:      'Claude attempt failed',
        attempt,
        orderId:  order.id,
        error:    lastError.message,
      });

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        await sleep(BASE_DELAY * Math.pow(2, attempt - 1));
      }
    }
  }

  logger.error({
    msg:     'Claude failed after all retries',
    orderId: order.id,
    error:   lastError.message,
  });

  throw lastError;
}
