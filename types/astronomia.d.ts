declare module 'astronomia' {
  export const julian: {
    CalendarGregorianToJD(y: number, m: number, d: number): number;
  };
  export const solar: {
    apparentLongitude(jd: number): number;
  };
  export const moonphase: {
    meanNew(jde: number): number;
    meanFull(jde: number): number;
  };
}

declare module 'astronomia/lib/*' {
  const mod: {
    position?(jde: number): { lon: number; lat: number; range: number };
    apparentLongitude?(jde: number): number;
  };
  export = mod;
}
