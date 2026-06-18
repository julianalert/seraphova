import Anthropic from '@anthropic-ai/sdk';
import type { Order, DailyTransits, ReadingJSON } from '@/types';
import { buildDailyReadingPrompt } from './buildPrompt';

const client = new Anthropic();

export async function generateDailyReading(
  order:       Order,
  transits:    DailyTransits,
  readingDate: string
): Promise<ReadingJSON> {
  const { system, user } = buildDailyReadingPrompt(order, transits, readingDate);

  const response = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 1000,
    system,
    messages:   [{ role: 'user', content: user }],
  });

  const raw = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  // Strip any accidental markdown fences
  const clean = raw.replace(/```json|```/g, '').trim();

  let parsed: ReadingJSON;
  try {
    parsed = JSON.parse(clean) as ReadingJSON;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${clean.slice(0, 200)}`);
  }

  // Sanity-check required fields
  if (!parsed.greeting || !parsed.body || !parsed.key_insight || !parsed.tags || !parsed.dominant_theme) {
    throw new Error('Claude response is missing required fields');
  }

  return parsed;
}
