import OpenAI from 'openai';
import type { Order, DailyTransits, ReadingJSON } from '@/types';
import { buildDailyReadingPrompt } from './buildPrompt';
import { logger } from '@/lib/logger';

const client = new OpenAI();

const MODEL        = 'gpt-5-nano';
const MAX_RETRIES  = 3;
const BASE_DELAY   = 1000; // ms

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const response = await client.chat.completions.create({
    model:           MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system',  content: system },
      { role: 'user',    content: user   },
    ],
  });

  return response.choices[0].message.content?.trim() ?? '';
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
      const raw = await callOpenAI(system, user);

      let parsed: ReadingJSON;
      try {
        parsed = JSON.parse(raw) as ReadingJSON;
      } catch {
        throw new Error(`Invalid JSON from OpenAI (attempt ${attempt}): ${raw.slice(0, 200)}`);
      }

      if (!parsed.greeting || !parsed.body || !parsed.key_insight || !Array.isArray(parsed.tags) || !parsed.dominant_theme) {
        throw new Error(`OpenAI response missing required fields (attempt ${attempt})`);
      }

      if (attempt > 1) {
        logger.info({ msg: 'OpenAI succeeded after retry', attempt, orderId: order.id });
      }

      return parsed;

    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      logger.warn({
        msg:     'OpenAI attempt failed',
        attempt,
        orderId: order.id,
        error:   lastError.message,
      });

      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY * Math.pow(2, attempt - 1));
      }
    }
  }

  logger.error({
    msg:     'OpenAI failed after all retries',
    orderId: order.id,
    error:   lastError.message,
  });

  throw lastError;
}
