import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { geocodeCity } from '@/lib/astrology/geocode';
import { computeNatalChart } from '@/lib/astrology/compute';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeDate,
  sanitizeTime,
  sanitizeFocusAreas,
  sanitizeDeliveryTime,
  sanitizeTimezone,
} from '@/lib/sanitize';

// 5 quiz submissions per IP per hour
const RATE_LIMIT = { limit: 5, windowSecs: 60 * 60 };

export async function POST(req: NextRequest) {
  // ─── Rate limit ──────────────────────────────────────────────────────────
  const ip     = getIp(req);
  const rl     = rateLimit(`orders:create:${ip}`, RATE_LIMIT);

  if (!rl.allowed) {
    logger.warn({ msg: 'Rate limit hit on orders/create', ip });
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status:  429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const body = await req.json();

    // ─── Sanitize inputs ────────────────────────────────────────────────────
    const birth_date    = sanitizeDate(body.birth_date);
    const birth_time    = sanitizeTime(body.birth_time);
    const birth_city    = sanitizeText(body.birth_city, 200);
    const first_name    = sanitizeText(body.first_name, 100);
    const email         = sanitizeEmail(body.email);
    const focus_areas   = sanitizeFocusAreas(body.focus_areas);
    const delivery_time = sanitizeDeliveryTime(body.delivery_time);
    const free_context  = sanitizeText(body.free_context, 1000) || null;
    const timezone      = sanitizeTimezone(body.timezone);

    // ─── Validate required fields ───────────────────────────────────────────
    if (!birth_date)              return NextResponse.json({ error: 'Invalid or missing date of birth.' },   { status: 400 });
    if (!birth_city)              return NextResponse.json({ error: 'Invalid or missing city of birth.' },   { status: 400 });
    if (!first_name)              return NextResponse.json({ error: 'Invalid or missing first name.' },      { status: 400 });
    if (!email)                   return NextResponse.json({ error: 'Invalid or missing email address.' },   { status: 400 });
    if (focus_areas.length === 0) return NextResponse.json({ error: 'Please select at least one focus area.' }, { status: 400 });

    logger.info({ msg: 'Order create started', ip, email, birth_city });

    // ─── Geocode birth city ─────────────────────────────────────────────────
    let birth_lat: number | null = null;
    let birth_lng: number | null = null;

    try {
      const geo = await geocodeCity(birth_city);
      birth_lat = geo.lat;
      birth_lng = geo.lng;
    } catch (err) {
      logger.warn({ msg: 'Geocoding failed', birth_city, error: String(err) });
      return NextResponse.json(
        { error: `Could not find "${birth_city}". Please check the spelling and try again.` },
        { status: 422 }
      );
    }

    // ─── Compute natal chart ────────────────────────────────────────────────
    let natal_chart = null;
    try {
      natal_chart = await computeNatalChart(birth_date, birth_time, birth_lat, birth_lng);
      logger.info({ msg: 'Natal chart computed', email, sun: natal_chart.sun.label });
    } catch (err) {
      logger.warn({ msg: 'Natal chart computation failed — saving without chart', email, error: String(err) });
    }

    // ─── Save order to Supabase ─────────────────────────────────────────────
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
        delivery_time,
        free_context,
        timezone,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      logger.error({ msg: 'Supabase insert failed', email, error: error.message });
      return NextResponse.json({ error: 'Failed to save your order. Please try again.' }, { status: 500 });
    }

    logger.info({ msg: 'Order created', orderId: data.id, email });

    return NextResponse.json({ orderId: data.id }, { status: 201 });

  } catch (err) {
    logger.error({ msg: 'Unhandled error in orders/create', error: String(err) });
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
