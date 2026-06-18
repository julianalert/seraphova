/**
 * Natal chart and transit computation using the `astronomia` library.
 *
 * We use Julian Day Numbers as the base time representation and compute
 * planet longitudes via VSOP87 series coefficients bundled with astronomia.
 */
import { julian, solar, moonphase } from 'astronomia';
import type { NatalChart, PlanetPlacement, HousePlacement, DailyTransits, TransitEvent } from '@/types';
import { SIGNS, SIGN_DATA } from './constants';
import { findAspects } from './aspects';

// ─── Julian Day helpers ───────────────────────────────────────────────────────

function dateToJD(dateStr: string, timeStr: string | null): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  let hour = 12; // noon default when birth time unknown
  if (timeStr) {
    const [h, min] = timeStr.split(':').map(Number);
    hour = h + min / 60;
  }
  return julian.CalendarGregorianToJD(y, m, d + hour / 24);
}

// ─── Longitude → sign + degree ───────────────────────────────────────────────

function longitudeToSign(lon: number): { sign: string; degree: number } {
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex  = Math.floor(normalized / 30);
  return {
    sign:   SIGNS[signIndex],
    degree: Math.round((normalized % 30) * 100) / 100,
  };
}

// ─── House calculation (Placidus-like using RAMC) ────────────────────────────
// Simplified Placidus: uses sidereal time for cusp calculation.

function computeHouseCusps(jd: number, lat: number, lng: number): number[] {
  // RAMC = Right Ascension of Midheaven
  const lst    = siderealTime(jd, lng); // local sidereal time in degrees
  const ramc   = lst;
  const eps    = obliquity(jd);          // obliquity of ecliptic
  const latRad = (lat * Math.PI) / 180;
  const epsRad = (eps * Math.PI) / 180;

  const cusps: number[] = new Array(13).fill(0);

  // MC (10th cusp)
  const mcRad = Math.atan2(Math.cos((ramc * Math.PI) / 180), -Math.sin((ramc * Math.PI) / 180) * Math.cos(epsRad));
  cusps[10]   = ((mcRad * 180) / Math.PI + 360) % 360;

  // IC (4th cusp)
  cusps[4] = (cusps[10] + 180) % 360;

  // ASC (1st cusp) using standard formula
  const ascRad = Math.atan2(
    Math.cos((ramc * Math.PI) / 180),
    -(Math.sin((ramc * Math.PI) / 180) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad))
  );
  cusps[1] = ((ascRad * 180) / Math.PI + 360) % 360;

  // DSC (7th cusp)
  cusps[7] = (cusps[1] + 180) % 360;

  // Intermediate cusps — equal-house fallback for houses 2,3,5,6,8,9,11,12
  for (let i = 1; i <= 12; i++) {
    if (!cusps[i]) {
      const prevAnchor = i <= 3  ? cusps[1] :
                         i <= 6  ? cusps[4] :
                         i <= 9  ? cusps[7] : cusps[10];
      const offset = ((i - 1) % 3) * 30;
      cusps[i] = (prevAnchor + offset) % 360;
    }
  }

  return cusps;
}

function siderealTime(jd: number, lng: number): number {
  const T  = (jd - 2451545.0) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) +
               0.000387933 * T * T - T * T * T / 38710000;
  return ((gmst + lng) % 360 + 360) % 360;
}

function obliquity(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return 23.439291111 - 0.013004167 * T - 0.000000164 * T * T + 0.000000504 * T * T * T;
}

function houseForLongitude(lon: number, cusps: number[]): number {
  const normalized = ((lon % 360) + 360) % 360;
  for (let h = 1; h <= 12; h++) {
    const start = cusps[h];
    const end   = cusps[h === 12 ? 1 : h + 1];
    if (start <= end) {
      if (normalized >= start && normalized < end) return h;
    } else {
      // wraps over 360
      if (normalized >= start || normalized < end) return h;
    }
  }
  return 1;
}

// ─── Planet longitude via astronomia ─────────────────────────────────────────

type PlanetModule = {
  position?: (jde: number) => { lon: number };
  apparentLongitude?: (jde: number) => number;
};

async function getPlanetLongitude(planetName: string, jd: number): Promise<{ lon: number; retrograde: boolean }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(`astronomia/lib/${planetName}`) as PlanetModule;
    const lon = mod.position?.(jd)?.lon ?? mod.apparentLongitude?.(jd) ?? 0;
    const lon2 = mod.position?.(jd + 1)?.lon ?? mod.apparentLongitude?.(jd + 1) ?? 0;
    const retrograde = ((lon2 - lon + 360) % 360) > 180;
    return { lon: ((lon % 360) + 360) % 360, retrograde };
  } catch {
    // Fallback — compute approximate position based on known orbital periods
    return approximatePlanetLon(planetName, jd);
  }
}

// Rough approximations as fallback (mean motion only)
function approximatePlanetLon(planet: string, jd: number): { lon: number; retrograde: boolean } {
  const J2000 = 2451545.0;
  const t = jd - J2000;
  const periods: Record<string, { period: number; epoch_lon: number }> = {
    sun:       { period: 365.25,   epoch_lon: 280.46 },
    moon:      { period: 27.32,    epoch_lon: 218.32 },
    mercury:   { period: 87.97,    epoch_lon: 252.25 },
    venus:     { period: 224.70,   epoch_lon: 181.98 },
    mars:      { period: 686.97,   epoch_lon: 355.45 },
    jupiter:   { period: 4332.59,  epoch_lon: 34.40 },
    saturn:    { period: 10759.22, epoch_lon: 49.94 },
    uranus:    { period: 30688.5,  epoch_lon: 313.23 },
    neptune:   { period: 60182.0,  epoch_lon: 304.88 },
    pluto:     { period: 90560.0,  epoch_lon: 238.96 },
  };
  const data = periods[planet.toLowerCase()] ?? { period: 365.25, epoch_lon: 0 };
  const lon = ((data.epoch_lon + (t / data.period) * 360) % 360 + 360) % 360;
  return { lon, retrograde: false };
}

// ─── Sun longitude (use astronomia solar module) ──────────────────────────────

function getSunLongitude(jd: number): { lon: number; retrograde: boolean } {
  try {
    const lon = solar.apparentLongitude(jd);
    return { lon: ((lon * 180 / Math.PI) % 360 + 360) % 360, retrograde: false };
  } catch {
    return approximatePlanetLon('sun', jd);
  }
}

// ─── Build a PlanetPlacement ─────────────────────────────────────────────────

function buildPlacement(
  planetName:  string,
  lon:         number,
  retrograde:  boolean,
  cusps:       number[] | null
): PlanetPlacement {
  const { sign, degree } = longitudeToSign(lon);
  const house = cusps ? houseForLongitude(lon, cusps) : null;
  const retroStr = retrograde ? ' ℞' : '';
  const houseStr = house ? `, ${house}${ordinal(house)} house` : '';
  return {
    planet:    planetName,
    sign,
    house,
    degree,
    retrograde,
    label:     `${planetName} in ${sign} (${degree.toFixed(0)}°)${retroStr}${houseStr}`,
  };
}

function ordinal(n: number): string {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ─── Dominant element / modality ─────────────────────────────────────────────

function computeDominantElementAndModality(placements: PlanetPlacement[]) {
  const elementCount:  Record<string, number> = {};
  const modalityCount: Record<string, number> = {};

  const weights: Record<string, number> = {
    Sun: 3, Moon: 3, rising: 3, Mercury: 2, Venus: 2, Mars: 2,
    Jupiter: 1, Saturn: 1, Uranus: 1, Neptune: 1, Pluto: 1,
  };

  for (const p of placements) {
    const data = SIGN_DATA[p.sign];
    if (!data) continue;
    const w = weights[p.planet] ?? 1;
    elementCount[data.element]  = (elementCount[data.element]  || 0) + w;
    modalityCount[data.modality] = (modalityCount[data.modality] || 0) + w;
  }

  const dominant_element  = Object.entries(elementCount).sort((a,b) => b[1]-a[1])[0]?.[0] as NatalChart['dominant_element'] ?? 'fire';
  const dominant_modality = Object.entries(modalityCount).sort((a,b) => b[1]-a[1])[0]?.[0] as NatalChart['dominant_modality'] ?? 'cardinal';

  return { dominant_element, dominant_modality };
}

// ─── Stelliums ────────────────────────────────────────────────────────────────

function findStelliums(placements: PlanetPlacement[]): string[] {
  const houseBuckets: Record<number, string[]> = {};
  for (const p of placements) {
    if (!p.house) continue;
    if (!houseBuckets[p.house]) houseBuckets[p.house] = [];
    houseBuckets[p.house].push(p.planet);
  }
  return Object.entries(houseBuckets)
    .filter(([, ps]) => ps.length >= 3)
    .map(([h, ps]) => `${h}${ordinal(Number(h))} house stellium (${ps.join(', ')})`);
}

// ─── Main natal chart computation ────────────────────────────────────────────

export async function computeNatalChart(
  birthDate: string,
  birthTime: string | null,
  birthLat:  number,
  birthLng:  number
): Promise<NatalChart> {
  const jd = dateToJD(birthDate, birthTime);
  const hasTime = birthTime !== null;

  const cusps = hasTime ? computeHouseCusps(jd, birthLat, birthLng) : null;

  const { lon: sunLon } = getSunLongitude(jd);
  const planets = await Promise.all([
    getPlanetLongitude('moon',    jd),
    getPlanetLongitude('mercury', jd),
    getPlanetLongitude('venus',   jd),
    getPlanetLongitude('mars',    jd),
    getPlanetLongitude('jupiter', jd),
    getPlanetLongitude('saturn',  jd),
    getPlanetLongitude('uranus',  jd),
    getPlanetLongitude('neptune', jd),
    getPlanetLongitude('pluto',   jd),
  ]);

  const [moonData, mercuryData, venusData, marsData, jupiterData, saturnData, uranusData, neptuneData, plutoData] = planets;

  // North Node (mean) — moves ~19.3° per year retrograde
  const J2000 = 2451545.0;
  const nnLon = ((125.04 - 0.0529538 * (jd - J2000)) % 360 + 360) % 360;

  const sun      = buildPlacement('Sun',        sunLon,         false,            cusps);
  const moon     = buildPlacement('Moon',       moonData.lon,   moonData.retrograde,     cusps);
  const mercury  = buildPlacement('Mercury',    mercuryData.lon, mercuryData.retrograde,  cusps);
  const venus    = buildPlacement('Venus',      venusData.lon,  venusData.retrograde,    cusps);
  const mars     = buildPlacement('Mars',       marsData.lon,   marsData.retrograde,     cusps);
  const jupiter  = buildPlacement('Jupiter',    jupiterData.lon, jupiterData.retrograde,  cusps);
  const saturn   = buildPlacement('Saturn',     saturnData.lon, saturnData.retrograde,   cusps);
  const uranus   = buildPlacement('Uranus',     uranusData.lon, uranusData.retrograde,   cusps);
  const neptune  = buildPlacement('Neptune',    neptuneData.lon, neptuneData.retrograde,  cusps);
  const pluto    = buildPlacement('Pluto',      plutoData.lon,  plutoData.retrograde,    cusps);
  const northNode = buildPlacement('North Node', nnLon,          true,             cusps);

  // Rising sign from ASC cusp
  let rising: PlanetPlacement | null = null;
  if (cusps) {
    const { sign, degree } = longitudeToSign(cusps[1]);
    rising = {
      planet: 'Rising',
      sign,
      house: 1,
      degree,
      retrograde: false,
      label: `${sign} Rising (${degree.toFixed(0)}°)`,
    };
  }

  const allPlacements = [sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto];
  const { dominant_element, dominant_modality } = computeDominantElementAndModality(
    rising ? [...allPlacements, rising] : allPlacements
  );
  const stelliums = findStelliums(allPlacements);

  const chart_ruler = rising ? (SIGN_DATA[rising.sign]?.ruler ?? 'Sun') : SIGN_DATA[sun.sign]?.ruler ?? 'Sun';

  let houses: HousePlacement[] | null = null;
  if (cusps) {
    const planetsByHouse: Record<number, string[]> = {};
    for (const p of allPlacements) {
      if (!p.house) continue;
      if (!planetsByHouse[p.house]) planetsByHouse[p.house] = [];
      planetsByHouse[p.house].push(p.planet);
    }
    houses = Array.from({ length: 12 }, (_, i) => ({
      house:   i + 1,
      sign:    longitudeToSign(cusps[i + 1]).sign,
      planets: planetsByHouse[i + 1] ?? [],
    }));
  }

  return {
    sun, moon, rising, mercury, venus, mars,
    jupiter, saturn, uranus, neptune, pluto, northNode,
    dominant_element, dominant_modality, stelliums, chart_ruler, houses,
  };
}

// ─── Daily transits ───────────────────────────────────────────────────────────

export async function computeDailyTransits(date: string): Promise<DailyTransits> {
  const jd = dateToJD(date, '12:00');

  const { lon: sunLon } = getSunLongitude(jd);
  const rawPlanets = await Promise.all([
    getPlanetLongitude('moon',    jd),
    getPlanetLongitude('mercury', jd),
    getPlanetLongitude('venus',   jd),
    getPlanetLongitude('mars',    jd),
    getPlanetLongitude('jupiter', jd),
    getPlanetLongitude('saturn',  jd),
    getPlanetLongitude('uranus',  jd),
    getPlanetLongitude('neptune', jd),
    getPlanetLongitude('pluto',   jd),
  ]);

  const planetEntries: [string, { lon: number; retrograde: boolean }][] = [
    ['Sun',     { lon: sunLon, retrograde: false }],
    ['Moon',    rawPlanets[0]],
    ['Mercury', rawPlanets[1]],
    ['Venus',   rawPlanets[2]],
    ['Mars',    rawPlanets[3]],
    ['Jupiter', rawPlanets[4]],
    ['Saturn',  rawPlanets[5]],
    ['Uranus',  rawPlanets[6]],
    ['Neptune', rawPlanets[7]],
    ['Pluto',   rawPlanets[8]],
  ];

  const planets: DailyTransits['planets'] = {};
  for (const [name, data] of planetEntries) {
    const { sign, degree } = longitudeToSign(data.lon);
    planets[name] = {
      sign,
      degree,
      retrograde:    data.retrograde,
      house_of_aries: Math.floor(data.lon / 30) + 1,
    };
  }

  // Aspects
  const aspectInput: Record<string, { longitude: number; name: string; retrograde: boolean }> = {};
  for (const [name, data] of planetEntries) {
    aspectInput[name.toLowerCase()] = { longitude: data.lon, name, retrograde: data.retrograde };
  }
  const aspects = findAspects(aspectInput).slice(0, 8); // top 8 by orb

  // Notable events
  const events: TransitEvent[] = [];
  try {
    const phase = moonphase.meanNew(dateToJD(date, '00:00'));
    const phaseJD = dateToJD(date, '12:00');
    const diff = Math.abs(phase - phaseJD);
    if (diff < 1.5) events.push({ type: 'moon_phase', description: 'New Moon', significance: 'major' });
    const fullPhase = moonphase.meanFull(dateToJD(date, '00:00'));
    if (Math.abs(fullPhase - phaseJD) < 1.5) events.push({ type: 'moon_phase', description: `Full Moon in ${planets['Moon'].sign}`, significance: 'major' });
  } catch { /* skip moon phase events if calc fails */ }

  // Flag retrograde stations (simplified: check if retrograde status changed)
  for (const [name, data] of planetEntries.slice(2)) { // Mercury onwards
    if (data.retrograde) {
      events.push({ type: 'station', description: `${name} retrograde`, significance: 'minor' });
    }
  }

  // Build human-readable summary
  const retrogrades = planetEntries.filter(([, d]) => d.retrograde).map(([n]) => n);
  const retStr = retrogrades.length ? ` ${retrogrades.join(', ')} ${retrogrades.length === 1 ? 'is' : 'are'} retrograde.` : '';
  const summary = `${Object.entries(planets).map(([n, p]) => `${n} in ${p.sign} (${p.degree.toFixed(1)}°)`).join(', ')}.${retStr}`;

  return { date, planets, aspects, events, summary };
}
