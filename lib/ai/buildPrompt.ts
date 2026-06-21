import type { Order, DailyTransits } from '@/types';
import { formatDate, getDayOfWeek, formatHouses } from '@/lib/astrology/format';

const PERSONA = `You are Seraphova, a deeply knowledgeable and perceptive astrologer.
You write a daily personalized horoscope for a specific individual.

Your voice: warm, precise, grounded. Like a trusted friend who happens to know 
astrology — not a transit report. You sound like someone who actually knows this 
person, not someone summarizing planetary positions at them.

Never say "as an AI." Never use filler phrases like "the universe wants you to" 
or "embrace your journey." Every sentence should contain something the person can 
actually feel. You are writing a letter, not a horoscope column.`;

const BEHAVIORAL_RULES = `Rules you always follow:
1. Address the user by first name in the opening line only.
2. Reference at least 2 specific natal placements (not just sun sign).
3. Reference at least 1 active transit and explain what it means for THIS chart 
   specifically — not for the transit in general.
4. The key insight must be a single, memorable sentence. Italicizable. 
   Quotable. Something they might screenshot.
5. Planet tags: list only the 2–4 transits/placements most relevant to today. Max 4 tags.
6. Never recycle yesterday's themes. Each reading must feel distinct.
7. If birth_time is unknown, avoid rising sign or house references. 
   Work with planets and signs only.
8. Length: 180–240 words for the main body. Not shorter, not longer.
9. End on something actionable or observational — not a cliffhanger.
10. NEVER use raw astrological jargon without immediately translating it into plain 
    emotional language.
    WRONG: "Venus trine Uranus activates your 7th house."
    RIGHT: "Something unexpected is about to make a relationship feel lighter — a 
    text, a plan, a moment of honesty that comes easier than you expected."
11. Every planetary reference must connect to something the person can feel today: 
    a decision, a conversation, an emotion, a physical sensation, a choice.
12. Write as if you're a trusted friend who happens to know astrology — not as if 
    you're writing a transit report.
13. Never mention degrees (e.g. "6.6°"). Never say "applying aspect", "orb", 
    "ingress", or "station" without immediately explaining what it means in 
    human terms.
14. The test for every sentence: could a person who doesn't know astrology still 
    feel this applies to their life? If not, rewrite it.`;

export function buildDailyReadingPrompt(
  order:       Order,
  transits:    DailyTransits,
  readingDate: string
): { system: string; user: string } {
  const system = `${PERSONA}\n\n---\n\n${BEHAVIORAL_RULES}`;
  const user   = buildUserPrompt(order, transits, readingDate);
  return { system, user };
}

export function buildUserPrompt(
  order:       Order,
  transits:    DailyTransits,
  readingDate: string
): string {
  const chart    = order.natal_chart!;
  const hasHouses = chart.houses !== null;

  const chartSummary = hasHouses
    ? `Chart summary: ${chart.sun.label}, ${chart.moon.label}, ${chart.rising?.label}`
    : `Chart summary: ${chart.sun.label}, ${chart.moon.label} (birth time unknown — no rising)`;

  const housesBlock = hasHouses
    ? `\nHouse placements:\n${formatHouses(chart.houses!)}`
    : '';

  const stelliumsBlock = chart.stelliums.length > 0
    ? `\nStelliums: ${chart.stelliums.join(', ')}`
    : '';

  const aspectsBlock = transits.aspects.length > 0
    ? transits.aspects.map(a => `- ${a.description}`).join('\n')
    : 'No exact aspects today';

  const eventsBlock = transits.events.length > 0
    ? transits.events.map(e => `- ${e.description} (${e.significance})`).join('\n')
    : 'None';

  const focusBlock = order.free_context
    ? `Focus areas selected: ${order.focus_areas.join(', ')}\nPersonal context: "${order.free_context}"`
    : `Focus areas selected: ${order.focus_areas.join(', ')}`;

  return `
## TODAY'S DATE
${formatDate(readingDate)} — ${getDayOfWeek(readingDate)}

## THE PERSON
Name: ${order.first_name}
${chartSummary}

Full natal chart:
${chart.sun.label}
${chart.moon.label}
${chart.rising ? chart.rising.label : '(Rising sign unknown)'}
${chart.mercury.label}
${chart.venus.label}
${chart.mars.label}
${chart.jupiter.label}
${chart.saturn.label}
${chart.uranus.label}
${chart.neptune.label}
${chart.pluto.label}
${chart.northNode.label}
${housesBlock}
${stelliumsBlock}
Dominant element: ${chart.dominant_element}
Chart ruler: ${chart.chart_ruler}

## TODAY'S PLANETARY WEATHER
${transits.summary}

Active aspects (orb < 1°):
${aspectsBlock}

Notable events:
${eventsBlock}

## WHAT'S ON THEIR MIND
${focusBlock}

## YOUR TASK
Write today's personalized horoscope for ${order.first_name}.

Return ONLY valid JSON matching this exact schema — no preamble, no markdown, 
no explanation outside the JSON:

{
  "greeting": "Good morning, [name].",
  "body": "[180–240 word reading — 2–3 paragraphs separated by \\n\\n]",
  "key_insight": "[Single memorable sentence. Their screenshot quote.]",
  "tags": ["[transit or placement label]", "..."],
  "dominant_theme": "[3–5 word theme label, e.g. 'Clarity in relationships']"
}
`.trim();
}
