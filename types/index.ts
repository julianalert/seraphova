// ─── Core domain types ───────────────────────────────────────────────────────

export interface PlanetPlacement {
  planet:     string;
  sign:       string;
  house:      number | null;
  degree:     number;
  retrograde: boolean;
  label:      string;
}

export interface HousePlacement {
  house:   number;
  sign:    string;
  planets: string[];
}

export interface NatalChart {
  sun:       PlanetPlacement;
  moon:      PlanetPlacement;
  rising:    PlanetPlacement | null;
  mercury:   PlanetPlacement;
  venus:     PlanetPlacement;
  mars:      PlanetPlacement;
  jupiter:   PlanetPlacement;
  saturn:    PlanetPlacement;
  uranus:    PlanetPlacement;
  neptune:   PlanetPlacement;
  pluto:     PlanetPlacement;
  northNode: PlanetPlacement;

  dominant_element:  'fire' | 'earth' | 'air' | 'water';
  dominant_modality: 'cardinal' | 'fixed' | 'mutable';
  stelliums:         string[];
  chart_ruler:       string;
  houses:            HousePlacement[] | null;
}

export interface TransitAspect {
  planet1:     string;
  planet2:     string;
  aspect:      'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  orb:         number;
  applying:    boolean;
  description: string;
}

export interface TransitEvent {
  type:         'moon_phase' | 'station' | 'ingress' | 'eclipse';
  description:  string;
  significance: 'major' | 'minor';
}

export interface DailyTransits {
  date:    string;
  planets: {
    [planet: string]: {
      sign:          string;
      degree:        number;
      retrograde:    boolean;
      house_of_aries: number;
    };
  };
  aspects: TransitAspect[];
  events:  TransitEvent[];
  summary: string;
}

export interface ReadingJSON {
  greeting:       string;
  body:           string;
  key_insight:    string;
  tags:           string[];
  dominant_theme: string;
}

export interface Order {
  id:                       string;
  first_name:               string;
  email:                    string;
  birth_date:               string;
  birth_time:               string | null;
  birth_city:               string;
  birth_lat:                number | null;
  birth_lng:                number | null;
  natal_chart:              NatalChart | null;
  focus_areas:              string[];
  delivery_time:            string;
  free_context:             string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id:         string | null;
  amount_paid:              number | null;
  paid_at:                  string | null;
  status:                   'pending' | 'paid' | 'expired' | 'paused';
  access_start:             string | null;
  access_end:               string | null;
  total_sent:               number;
  last_sent_at:             string | null;
  renewal_email_sent:       boolean;
  expiry_email_sent:        boolean;
  created_at:               string;
  updated_at:               string;
}

export interface DailyReading {
  id:                string;
  order_id:          string;
  reading_date:      string;
  raw_prompt:        string | null;
  raw_response:      string | null;
  parsed_reading:    ReadingJSON | null;
  sent_at:           string | null;
  resend_message_id: string | null;
  open_tracked:      boolean;
  created_at:        string;
}
