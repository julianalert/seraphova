import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { geocodeCity } from '@/lib/astrology/geocode';
import { computeNatalChart } from '@/lib/astrology/compute';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ─── Validate required fields ─────────────────────────────────────────────
    const { birth_date, birth_city, first_name, email, focus_areas, delivery_time } = body;

    if (!birth_date || !birth_city || !first_name || !email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    if (!Array.isArray(focus_areas) || focus_areas.length === 0) {
      return NextResponse.json({ error: 'Please select at least one focus area.' }, { status: 400 });
    }

    const birth_time: string | null  = body.birth_time || null;
    const free_context: string | null = body.free_context?.trim() || null;

    // ─── Geocode birth city ───────────────────────────────────────────────────
    let birth_lat: number | null = null;
    let birth_lng: number | null = null;

    try {
      const geo = await geocodeCity(birth_city);
      birth_lat = geo.lat;
      birth_lng = geo.lng;
    } catch (err) {
      console.error('[geocode] Failed:', err);
      return NextResponse.json(
        { error: `Could not find "${birth_city}". Please check the spelling and try again.` },
        { status: 422 }
      );
    }

    // ─── Compute natal chart ──────────────────────────────────────────────────
    let natal_chart = null;

    try {
      natal_chart = await computeNatalChart(birth_date, birth_time, birth_lat, birth_lng);
    } catch (err) {
      console.error('[natal_chart] Failed:', err);
      // Non-fatal: save the order without the chart; it can be recomputed
    }

    // ─── Save order to Supabase ───────────────────────────────────────────────
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        first_name,
        email,
        birth_date,
        birth_time,
        birth_city,
        birth_lat,
        birth_lng,
        natal_chart,
        focus_areas,
        delivery_time: delivery_time ?? '7am',
        free_context,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[supabase] Insert failed:', error);
      return NextResponse.json({ error: 'Failed to save your order. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ orderId: data.id }, { status: 201 });

  } catch (err) {
    console.error('[orders/create] Unhandled error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
