import { TransitAspect } from '@/types';
import { ASPECT_ORBS, ASPECT_ANGLES } from './constants';

export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return diff > 180 ? 360 - diff : diff;
}

export function findAspects(
  planets: Record<string, { longitude: number; name: string; retrograde: boolean }>
): TransitAspect[] {
  const aspects: TransitAspect[] = [];
  const planetKeys = Object.keys(planets);

  for (let i = 0; i < planetKeys.length; i++) {
    for (let j = i + 1; j < planetKeys.length; j++) {
      const p1 = planets[planetKeys[i]];
      const p2 = planets[planetKeys[j]];
      const dist = angularDistance(p1.longitude, p2.longitude);

      for (const [aspectName, angle] of Object.entries(ASPECT_ANGLES)) {
        const orb = Math.abs(dist - angle);
        const maxOrb = ASPECT_ORBS[aspectName];

        if (orb <= maxOrb) {
          // Determine applying vs separating based on motion direction
          const p1Lon = normalizeAngle(p1.longitude);
          const p2Lon = normalizeAngle(p2.longitude);
          const applying = p1Lon < p2Lon
            ? !p1.retrograde
            : p1.retrograde;

          aspects.push({
            planet1:     p1.name,
            planet2:     p2.name,
            aspect:      aspectName as TransitAspect['aspect'],
            orb:         Math.round(orb * 10) / 10,
            applying,
            description: `${p1.name} ${aspectName} ${p2.name} (${orb.toFixed(1)}° orb, ${applying ? 'applying' : 'separating'})`,
          });
        }
      }
    }
  }

  // Sort by tightness (smallest orb first)
  return aspects.sort((a, b) => a.orb - b.orb);
}
