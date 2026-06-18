// Zodiac signs in order
export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type ZodiacSign = typeof SIGNS[number];

// Sign metadata
export const SIGN_DATA: Record<string, { element: 'fire'|'earth'|'air'|'water'; modality: 'cardinal'|'fixed'|'mutable'; ruler: string }> = {
  Aries:       { element: 'fire',  modality: 'cardinal', ruler: 'Mars' },
  Taurus:      { element: 'earth', modality: 'fixed',    ruler: 'Venus' },
  Gemini:      { element: 'air',   modality: 'mutable',  ruler: 'Mercury' },
  Cancer:      { element: 'water', modality: 'cardinal', ruler: 'Moon' },
  Leo:         { element: 'fire',  modality: 'fixed',    ruler: 'Sun' },
  Virgo:       { element: 'earth', modality: 'mutable',  ruler: 'Mercury' },
  Libra:       { element: 'air',   modality: 'cardinal', ruler: 'Venus' },
  Scorpio:     { element: 'water', modality: 'fixed',    ruler: 'Pluto' },
  Sagittarius: { element: 'fire',  modality: 'mutable',  ruler: 'Jupiter' },
  Capricorn:   { element: 'earth', modality: 'cardinal', ruler: 'Saturn' },
  Aquarius:    { element: 'air',   modality: 'fixed',    ruler: 'Uranus' },
  Pisces:      { element: 'water', modality: 'mutable',  ruler: 'Neptune' },
};

// Aspect orb thresholds (tight — quality over quantity)
export const ASPECT_ORBS: Record<string, number> = {
  conjunction: 8,
  opposition:  8,
  trine:       6,
  square:      6,
  sextile:     4,
};

// Aspect angles
export const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0,
  sextile:     60,
  square:      90,
  trine:       120,
  opposition:  180,
};

// Planet display names
export const PLANET_NAMES: Record<string, string> = {
  sun:       'Sun',
  moon:      'Moon',
  mercury:   'Mercury',
  venus:     'Venus',
  mars:      'Mars',
  jupiter:   'Jupiter',
  saturn:    'Saturn',
  uranus:    'Uranus',
  neptune:   'Neptune',
  pluto:     'Pluto',
  northNode: 'North Node',
};
