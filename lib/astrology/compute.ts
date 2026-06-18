/**
 * Natal chart and transit computation — Jean Meeus "Astronomical Algorithms" (2nd ed.)
 *
 * Sun:     Chapter 25   (~0.01° accuracy)
 * Moon:    Chapter 47 simplified  (~0.1° accuracy)
 * Planets: Keplerian elements with main perturbations  (~0.5–1° accuracy)
 * Houses:  Porphyry (divides each quadrant into thirds — reliable for all latitudes)
 * Aspects: major aspects with standard orbs
 */

import type { NatalChart, PlanetPlacement, HousePlacement, DailyTransits, TransitEvent } from '@/types';
import { SIGNS, SIGN_DATA } from './constants';
import { findAspects } from './aspects';

// ── Utilities ──────────────────────────────────────────────────────────────

function toRad(d: number): number { return d * Math.PI / 180; }
function toDeg(r: number): number { return r * 180 / Math.PI; }
function normalize(d: number): number { return ((d % 360) + 360) % 360; }

function dateToJD(
  dateStr:   string,
  timeStr:   string | null,
  utcOffset  = 0,
): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  let hour = 12; // noon default when no birth time
  if (timeStr) {
    const [h, min] = timeStr.split(':').map(Number);
    hour = h + min / 60;
  }
  // Convert local time to UT
  const ut = hour - utcOffset;
  const day = d + ut / 24;

  let year = y, month = m;
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// ── Sun (Meeus Ch 25) ──────────────────────────────────────────────────────

function sunLongitude(jd: number): number {
  const T  = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  const M  = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T2);
  const Mr = toRad(M);
  const C  = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
           + 0.000289 * Math.sin(3 * Mr);
  const sunTrue = L0 + C;
  const omega   = 125.04 - 1934.136 * T;
  return normalize(sunTrue - 0.00569 - 0.00478 * Math.sin(toRad(omega)));
}

// ── Moon (Meeus Ch 47 simplified, 45 terms) ───────────────────────────────

function moonLongitude(jd: number): number {
  const T  = (jd - 2451545.0) / 36525;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

  const Lp = normalize(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841    - T4 / 65194000);
  const D  = normalize(297.8501921 + 445267.1114034  * T - 0.0018819 * T2 + T3 / 545868    - T4 / 113065000);
  const M  = normalize(357.5291092 + 35999.0502909   * T - 0.0001536 * T2 + T3 / 24490000);
  const Mp = normalize(134.9634114 + 477198.8676313  * T + 0.0089970 * T2 + T3 / 69699     - T4 / 14712000);
  const F  = normalize(93.2720950  + 483202.0175233  * T - 0.0036539 * T2 - T3 / 3526000   + T4 / 863310000);

  const e = 1 - 0.002516 * T - 0.0000074 * T2;

  const terms: number[][] = [
    [0, 0, 1, 0, 6288774], [2, 0,-1, 0, 1274027], [2, 0, 0, 0, 658314],
    [0, 0, 2, 0, 213618],  [0, 1, 0, 0,-185116],  [0, 0, 0, 2,-114332],
    [2, 0,-2, 0,  58793],  [2,-1,-1, 0,  57066],  [2, 0, 1, 0,  53322],
    [2,-1, 0, 0,  45758],  [0, 1,-1, 0, -40923],  [1, 0, 0, 0, -34720],
    [0, 1, 1, 0, -30383],  [2, 0, 0,-2,  15327],  [0, 0, 1, 2, -12528],
    [0, 0, 1,-2,  10980],  [4, 0,-1, 0,  10675],  [0, 0, 3, 0,  10034],
    [4, 0,-2, 0,   8548],  [2, 1,-1, 0,  -7888],  [2, 1, 0, 0,  -6766],
    [1, 0,-1, 0,  -5163],  [1, 1, 0, 0,   4987],  [2,-1, 1, 0,   4036],
    [2, 0, 2, 0,   3994],  [4, 0, 0, 0,   3861],  [2, 0,-3, 0,   3665],
    [0, 1,-2, 0,  -2689],  [2, 0,-1, 2,  -2602],  [2,-1,-2, 0,   2390],
    [1, 0, 1, 0,  -2348],  [2,-2, 0, 0,   2236],  [0, 1, 2, 0,  -2120],
    [0, 2, 0, 0,  -2069],  [2,-2,-1, 0,   2048],  [2, 0, 1,-2,  -1773],
    [2, 0, 0, 2,  -1595],  [4,-1,-1, 0,   1215],  [0, 0, 2, 2,  -1110],
    [3, 0,-1, 0,   -892],  [2, 1, 1, 0,   -810],  [4,-1,-2, 0,    759],
    [0, 2,-1, 0,   -713],  [2, 2,-1, 0,   -700],  [2, 1,-2, 0,    691],
  ];

  let sumL = 0;
  for (const [d, m, mp, f, coeff] of terms) {
    const arg = toRad(d * D + m * M + mp * Mp + f * F);
    const ef  = Math.abs(m) === 1 ? e : Math.abs(m) === 2 ? e * e : 1;
    sumL += coeff * ef * Math.sin(arg);
  }

  const A1 = toRad(normalize(119.75 + 131.849 * T));
  const A2 = toRad(normalize(53.09  + 479264.290 * T));
  sumL += 3958 * Math.sin(A1) + 1962 * Math.sin(toRad(Lp) - toRad(F)) + 318 * Math.sin(A2);

  return normalize(Lp + sumL / 1000000);
}

// ── Planets (Keplerian elements, Meeus Table 31.a) ─────────────────────────

interface OrbitalElements {
  L: number; Lrate: number;
  a: number;
  e: number; erate: number;
  pi: number; pirate: number;
  i: number;
  Om: number; Omrate: number;
}

const ELEMENTS: Record<string, OrbitalElements> = {
  earth:   { L:100.464457,Lrate:36000.7698278,  a:1.000000, e:0.016708634,erate:-0.000042037,pi:102.937348,pirate:0.3225654,i:0.0,   Om:0.0,     Omrate:0.0     },
  mercury: { L:252.250324,Lrate:149474.0722491, a:0.387098, e:0.205635,   erate:0.000020,   pi:77.4561,  pirate:0.1590,  i:7.005, Om:48.3313,  Omrate:-0.1288 },
  venus:   { L:181.979801,Lrate:58519.2130302,  a:0.723330, e:0.006773,   erate:-0.000014,  pi:131.5637, pirate:0.0000,  i:3.395, Om:76.6799,  Omrate:-0.2780 },
  mars:    { L:355.433275,Lrate:19141.6964746,  a:1.523688, e:0.093400,   erate:0.000090,   pi:336.0882, pirate:0.4438,  i:1.850, Om:49.5574,  Omrate:-0.2952 },
  jupiter: { L:34.351519, Lrate:3034.9056606,   a:5.202561, e:0.048498,   erate:0.000163,   pi:14.3309,  pirate:0.2155,  i:1.303, Om:100.4542, Omrate:0.1313  },
  saturn:  { L:50.077444, Lrate:1222.1137943,   a:9.554747, e:0.055546,   erate:-0.000346,  pi:93.0568,  pirate:0.5765,  i:2.489, Om:113.6634, Omrate:-0.2580 },
  uranus:  { L:314.055005,Lrate:428.4669983,    a:19.19126, e:0.047318,   erate:0.0000150,  pi:173.0052, pirate:1.4866,  i:0.773, Om:74.0060,  Omrate:0.0134  },
  neptune: { L:304.348665,Lrate:218.4862002,    a:30.06896, e:0.008606,   erate:0.0000150,  pi:48.1209,  pirate:1.4268,  i:1.770, Om:131.7843, Omrate:-0.0099 },
  pluto:   { L:238.958500,Lrate:145.1907922,    a:39.48168, e:0.248808,   erate:0.0000000,  pi:224.0700, pirate:0.0000,  i:17.14, Om:110.2990, Omrate:0.0000  },
};

interface HelioPos { x: number; y: number; r: number; lon: number }

function helioPos(name: string, T: number): HelioPos {
  const el  = ELEMENTS[name];
  const L   = normalize(el.L + el.Lrate * T);
  const e   = el.e + el.erate * T;
  const pi  = normalize(el.pi + el.pirate * T);
  const Om  = name === 'earth' ? 0 : normalize(el.Om + el.Omrate * T);
  const M   = normalize(L - pi);
  const E   = solveKepler(toRad(M), e);
  const v   = toDeg(2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)));
  const r   = el.a * (1 - e * Math.cos(E));
  const lonH = normalize(v + pi);

  const u  = toRad(normalize(lonH - Om));
  const ir = toRad(el.i);
  const Or = toRad(Om);
  const x  = r * (Math.cos(Or) * Math.cos(u) - Math.sin(Or) * Math.sin(u) * Math.cos(ir));
  const y  = r * (Math.sin(Or) * Math.cos(u) + Math.cos(Or) * Math.sin(u) * Math.cos(ir));

  return { x, y, r, lon: lonH };
}

function planetGeoLon(name: string, T: number): { lon: number; retrograde: boolean } {
  const planet = helioPos(name, T);
  const earth  = helioPos('earth', T);

  // Main Jupiter–Saturn mutual perturbations
  if (name === 'jupiter' || name === 'saturn') {
    const Lj  = ELEMENTS.jupiter.L + ELEMENTS.jupiter.Lrate * T;
    const Ls  = ELEMENTS.saturn.L  + ELEMENTS.saturn.Lrate  * T;
    const arg = toRad(2 * Lj - 5 * Ls - 67.69);
    if (name === 'jupiter') { planet.x += 0.332 * Math.cos(arg) / 57.296; planet.y += 0.332 * Math.sin(arg) / 57.296; }
    else                    { planet.x -= 0.814 * Math.cos(arg) / 57.296; planet.y -= 0.814 * Math.sin(arg) / 57.296; }
  }

  const dx  = planet.x - earth.x;
  const dy  = planet.y - earth.y;
  const lon = normalize(toDeg(Math.atan2(dy, dx)));

  const dt   = 0.01;
  const p2   = helioPos(name, T + dt);
  const e2   = helioPos('earth', T + dt);
  const lon2 = normalize(toDeg(Math.atan2(p2.y - e2.y, p2.x - e2.x)));
  const dlon = normalize(lon2 - lon + 180) - 180;

  return { lon, retrograde: dlon < 0 };
}

// ── Sidereal Time & Angles ─────────────────────────────────────────────────

function obliquity(T: number): number {
  const T2 = T * T, T3 = T2 * T;
  return 23.439291111 - 0.013004167 * T - 0.000000164 * T2 + 0.000000504 * T3;
}

function gmst(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return normalize(
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000
  );
}

/** Convert ecliptic longitude to Right Ascension (degrees) */
function eclToRA(lon: number, eps: number): number {
  return normalize(toDeg(Math.atan2(Math.sin(toRad(lon)) * Math.cos(toRad(eps)), Math.cos(toRad(lon)))));
}

/** Angular distance between two angles (always ≤ 180°) */
function angDist(a: number, b: number): number {
  const d = normalize(a - b);
  return d > 180 ? 360 - d : d;
}

function calcAscMC(lst: number, lat: number, eps: number): { asc: number; mc: number } {
  const lstR = toRad(lst);
  const epsR = toRad(eps);

  // MC: the ecliptic point on the upper meridian
  let mc = toDeg(Math.atan2(Math.sin(lstR), Math.cos(lstR) * Math.cos(epsR)));
  mc = normalize(mc);
  if (Math.cos(lstR) < 0) mc = normalize(mc + 180);

  // ASC: standard formula (Meeus Ch 14)
  const latR = toRad(lat);
  let asc = toDeg(Math.atan2(Math.cos(lstR), -(Math.sin(lstR) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR))));
  asc = normalize(asc);

  // Quadrant correction: pick the candidate whose RA is closest to the
  // eastern horizon (RA ≈ LST + 90°). The other candidate is 180° off.
  const eastRA = normalize(lst + 90);
  if (angDist(eclToRA(normalize(asc + 180), eps), eastRA) < angDist(eclToRA(asc, eps), eastRA)) {
    asc = normalize(asc + 180);
  }

  return { asc, mc };
}

// Porphyry houses: each quadrant divided into equal thirds along the ecliptic.
// Cusps array is 0-based: index 0 = H1 cusp (ASC), index 9 = H10 cusp (MC).
function computeHouseCusps(asc: number, mc: number): number[] {
  const ic  = normalize(mc  + 180);
  const dsc = normalize(asc + 180);

  // Arcs going forward (increasing longitude) through each quadrant
  const arcAscToIc  = normalize(ic  - asc);   // ASC → IC  (houses 1-2-3-4)
  const arcIcToDsc  = normalize(dsc - ic);    // IC  → DSC (houses 4-5-6-7)
  const arcDscToMc  = normalize(mc  - dsc);   // DSC → MC  (houses 7-8-9-10)
  const arcMcToAsc  = normalize(asc - mc);    // MC  → ASC (houses 10-11-12-1)

  return [
    asc,                                            // H1
    normalize(asc + arcAscToIc / 3),               // H2
    normalize(asc + (2 * arcAscToIc) / 3),         // H3
    ic,                                             // H4
    normalize(ic  + arcIcToDsc / 3),               // H5
    normalize(ic  + (2 * arcIcToDsc) / 3),         // H6
    dsc,                                            // H7
    normalize(dsc + arcDscToMc / 3),               // H8
    normalize(dsc + (2 * arcDscToMc) / 3),         // H9
    mc,                                             // H10
    normalize(mc  + arcMcToAsc / 3),               // H11
    normalize(mc  + (2 * arcMcToAsc) / 3),         // H12
  ];
}

function houseForLongitude(lon: number, cusps: number[]): number {
  for (let h = 0; h < 12; h++) {
    const start = cusps[h];
    const end   = cusps[(h + 1) % 12];
    const norm  = lon < start ? lon + 360 : lon;
    const endN  = end <= start ? end + 360 : end;
    if (norm >= start && norm < endN) return h + 1;
  }
  return 1;
}

function longitudeToSign(lon: number): { sign: string; degree: number } {
  const normalized = normalize(lon);
  const idx        = Math.floor(normalized / 30);
  return { sign: SIGNS[idx], degree: Math.round((normalized % 30) * 100) / 100 };
}

// ── Build a PlanetPlacement ────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

function buildPlacement(
  planetName: string,
  lon:        number,
  retrograde: boolean,
  cusps:      number[] | null,
): PlanetPlacement {
  const { sign, degree } = longitudeToSign(lon);
  const house    = cusps ? houseForLongitude(lon, cusps) : null;
  const retroStr = retrograde ? ' ℞' : '';
  const houseStr = house ? `, ${house}${ordinal(house)} house` : '';
  return {
    planet: planetName,
    sign,
    house,
    degree,
    retrograde,
    label: `${planetName} in ${sign} (${degree.toFixed(0)}°)${retroStr}${houseStr}`,
  };
}

// ── Parse timezone string ──────────────────────────────────────────────────

function parseTimezoneOffset(tz: string | null | undefined): number {
  if (!tz) return 0;
  const match = tz.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;
  const sign    = match[1] === '+' ? 1 : -1;
  const hours   = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours + minutes / 60);
}

// ── Dominant element / modality ────────────────────────────────────────────

function computeDominantElementAndModality(placements: PlanetPlacement[]) {
  const elementCount:  Record<string, number> = {};
  const modalityCount: Record<string, number> = {};
  const weights: Record<string, number> = {
    Sun: 3, Moon: 3, Rising: 3, Mercury: 2, Venus: 2, Mars: 2,
    Jupiter: 1, Saturn: 1, Uranus: 1, Neptune: 1, Pluto: 1,
  };
  for (const p of placements) {
    const data = SIGN_DATA[p.sign];
    if (!data) continue;
    const w = weights[p.planet] ?? 1;
    elementCount[data.element]   = (elementCount[data.element]   || 0) + w;
    modalityCount[data.modality] = (modalityCount[data.modality] || 0) + w;
  }
  const dominant_element  = (Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0]?.[0]  ?? 'fire') as NatalChart['dominant_element'];
  const dominant_modality = (Object.entries(modalityCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'cardinal') as NatalChart['dominant_modality'];
  return { dominant_element, dominant_modality };
}

function findStelliums(placements: PlanetPlacement[]): string[] {
  const buckets: Record<number, string[]> = {};
  for (const p of placements) {
    if (!p.house) continue;
    buckets[p.house] = buckets[p.house] ?? [];
    buckets[p.house].push(p.planet);
  }
  return Object.entries(buckets)
    .filter(([, ps]) => ps.length >= 3)
    .map(([h, ps]) => `${h}${ordinal(Number(h))} house stellium (${ps.join(', ')})`);
}

// ── Main natal chart computation ───────────────────────────────────────────

export async function computeNatalChart(
  birthDate: string,
  birthTime: string | null,
  birthLat:  number,
  birthLng:  number,
  timezone?: string | null,
): Promise<NatalChart> {
  const utcOffset = parseTimezoneOffset(timezone);
  const jd = dateToJD(birthDate, birthTime, utcOffset);
  const T  = (jd - 2451545.0) / 36525;
  const eps = obliquity(T);

  const hasTime = birthTime !== null;

  // Sun
  const sunLon = sunLongitude(jd);

  // Moon
  const moonLon = moonLongitude(jd);

  // Planets
  const mercuryData = planetGeoLon('mercury', T);
  const venusData   = planetGeoLon('venus',   T);
  const marsData    = planetGeoLon('mars',    T);
  const jupiterData = planetGeoLon('jupiter', T);
  const saturnData  = planetGeoLon('saturn',  T);
  const uranusData  = planetGeoLon('uranus',  T);
  const neptuneData = planetGeoLon('neptune', T);
  const plutoData   = planetGeoLon('pluto',   T);

  // Mean North Node (Meeus)
  const J2000  = 2451545.0;
  const nnLon  = normalize(125.04 - 0.0529538 * (jd - J2000));

  // Houses & angles
  let cusps:  number[] | null = null;
  let rising: PlanetPlacement | null = null;

  if (hasTime) {
    const lst         = normalize(gmst(jd) + birthLng);
    const { asc, mc } = calcAscMC(lst, birthLat, eps);
    cusps = computeHouseCusps(asc, mc);

    const { sign, degree } = longitudeToSign(asc);
    rising = {
      planet: 'Rising', sign, house: 1, degree, retrograde: false,
      label:  `${sign} Rising (${degree.toFixed(0)}°)`,
    };
  }

  const sun      = buildPlacement('Sun',        sunLon,          false,               cusps);
  const moon     = buildPlacement('Moon',       moonLon,         false,               cusps);
  const mercury  = buildPlacement('Mercury',    mercuryData.lon, mercuryData.retrograde, cusps);
  const venus    = buildPlacement('Venus',      venusData.lon,   venusData.retrograde,   cusps);
  const mars     = buildPlacement('Mars',       marsData.lon,    marsData.retrograde,    cusps);
  const jupiter  = buildPlacement('Jupiter',    jupiterData.lon, jupiterData.retrograde, cusps);
  const saturn   = buildPlacement('Saturn',     saturnData.lon,  saturnData.retrograde,  cusps);
  const uranus   = buildPlacement('Uranus',     uranusData.lon,  uranusData.retrograde,  cusps);
  const neptune  = buildPlacement('Neptune',    neptuneData.lon, neptuneData.retrograde, cusps);
  const pluto    = buildPlacement('Pluto',      plutoData.lon,   plutoData.retrograde,   cusps);
  const northNode = buildPlacement('North Node', nnLon,          true,                   cusps);

  const allPlacements = [sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto];
  const { dominant_element, dominant_modality } = computeDominantElementAndModality(
    rising ? [...allPlacements, rising] : allPlacements,
  );
  const stelliums  = findStelliums(allPlacements);
  const chart_ruler = rising ? (SIGN_DATA[rising.sign]?.ruler ?? 'Sun') : (SIGN_DATA[sun.sign]?.ruler ?? 'Sun');

  let houses: HousePlacement[] | null = null;
  if (cusps) {
    const planetsByHouse: Record<number, string[]> = {};
    for (const p of allPlacements) {
      if (!p.house) continue;
      planetsByHouse[p.house] = planetsByHouse[p.house] ?? [];
      planetsByHouse[p.house].push(p.planet);
    }
    houses = Array.from({ length: 12 }, (_, i) => ({
      house:   i + 1,
      sign:    longitudeToSign(cusps![i]).sign,
      planets: planetsByHouse[i + 1] ?? [],
    }));
  }

  return {
    sun, moon, rising, mercury, venus, mars,
    jupiter, saturn, uranus, neptune, pluto, northNode,
    dominant_element, dominant_modality, stelliums, chart_ruler, houses,
  };
}

// ── Daily transits ─────────────────────────────────────────────────────────

export async function computeDailyTransits(date: string): Promise<DailyTransits> {
  const jd = dateToJD(date, '12:00', 0);
  const T  = (jd - 2451545.0) / 36525;

  const sunLon      = sunLongitude(jd);
  const moonLon     = moonLongitude(jd);
  const mercuryData = planetGeoLon('mercury', T);
  const venusData   = planetGeoLon('venus',   T);
  const marsData    = planetGeoLon('mars',    T);
  const jupiterData = planetGeoLon('jupiter', T);
  const saturnData  = planetGeoLon('saturn',  T);
  const uranusData  = planetGeoLon('uranus',  T);
  const neptuneData = planetGeoLon('neptune', T);
  const plutoData   = planetGeoLon('pluto',   T);

  const planetEntries: [string, { lon: number; retrograde: boolean }][] = [
    ['Sun',     { lon: sunLon,          retrograde: false              }],
    ['Moon',    { lon: moonLon,         retrograde: false              }],
    ['Mercury', mercuryData],
    ['Venus',   venusData],
    ['Mars',    marsData],
    ['Jupiter', jupiterData],
    ['Saturn',  saturnData],
    ['Uranus',  uranusData],
    ['Neptune', neptuneData],
    ['Pluto',   plutoData],
  ];

  const planets: DailyTransits['planets'] = {};
  for (const [name, data] of planetEntries) {
    const { sign, degree } = longitudeToSign(data.lon);
    planets[name] = { sign, degree, retrograde: data.retrograde, house_of_aries: Math.floor(data.lon / 30) + 1 };
  }

  // Aspects
  const aspectInput: Record<string, { longitude: number; name: string; retrograde: boolean }> = {};
  for (const [name, data] of planetEntries) {
    aspectInput[name.toLowerCase()] = { longitude: data.lon, name, retrograde: data.retrograde };
  }
  const aspects = findAspects(aspectInput).slice(0, 8);

  // Events
  const events: TransitEvent[] = [];
  // Full/New moon detection (simple: check if Moon is within 12° of Sun or opposite)
  const moonSunDiff = normalize(moonLon - sunLon);
  if (moonSunDiff < 12 || moonSunDiff > 348) events.push({ type: 'moon_phase', description: 'New Moon', significance: 'major' });
  if (moonSunDiff > 168 && moonSunDiff < 192) events.push({ type: 'moon_phase', description: `Full Moon in ${planets['Moon'].sign}`, significance: 'major' });

  for (const [name, data] of planetEntries.slice(2)) {
    if (data.retrograde) events.push({ type: 'station', description: `${name} retrograde`, significance: 'minor' });
  }

  const retrogrades = planetEntries.filter(([, d]) => d.retrograde).map(([n]) => n);
  const retStr = retrogrades.length ? ` ${retrogrades.join(', ')} ${retrogrades.length === 1 ? 'is' : 'are'} retrograde.` : '';
  const summary = `${planetEntries.map(([n, p]) => `${n} in ${longitudeToSign(p.lon).sign} (${longitudeToSign(p.lon).degree.toFixed(1)}°)`).join(', ')}.${retStr}`;

  return { date, planets, aspects, events, summary };
}
