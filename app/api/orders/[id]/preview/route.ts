import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders';
import { getOrComputeTransits } from '@/lib/astrology/transits';
import { generateDailyReading } from '@/lib/ai/generateReading';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing order ID.' }, { status: 400 });
  }

  // ─── Fetch order ───────────────────────────────────────────────────────────
  const order = await getOrder(id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  if (!order.natal_chart) {
    return NextResponse.json({ error: 'Natal chart not yet computed.' }, { status: 422 });
  }

  // ─── Get today's transits (cached or freshly computed) ────────────────────
  const today   = new Date().toISOString().split('T')[0];
  const transits = await getOrComputeTransits(today);

  // ─── Generate preview reading via Claude ──────────────────────────────────
  const reading = await generateDailyReading(order, transits, today);

  return NextResponse.json({
    reading,
    // Return minimal chart data for the /order page to personalise the UI
    chart: {
      rising: order.natal_chart.rising?.label ?? null,
      moon:   order.natal_chart.moon.label,
      sun:    order.natal_chart.sun.label,
    },
    firstName: order.first_name,
  });
}
