import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client — safe to use in browser / Server Components
export const supabase = createClient(supabaseUrl, supabaseAnon);

// Service-role client — server-only, bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseService);
