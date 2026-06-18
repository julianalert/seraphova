import { supabaseAdmin } from './supabase';
import type { Order } from '@/types';

export async function getOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !data) return null;
  return data as Order;
}
