import { supabaseAdmin } from '@/lib/supabase';
import { computeDailyTransits } from './compute';
import type { DailyTransits } from '@/types';

export async function getTransitCache(date: string): Promise<DailyTransits | null> {
  const { data } = await supabaseAdmin
    .from('transit_cache')
    .select('transits')
    .eq('transit_date', date)
    .single();

  return data?.transits ?? null;
}

export async function saveTransitCache(date: string, transits: DailyTransits): Promise<void> {
  await supabaseAdmin
    .from('transit_cache')
    .upsert({ transit_date: date, transits });
}

export async function getOrComputeTransits(date: string): Promise<DailyTransits> {
  const cached = await getTransitCache(date);
  if (cached) return cached;

  const transits = await computeDailyTransits(date);
  await saveTransitCache(date, transits);
  return transits;
}
