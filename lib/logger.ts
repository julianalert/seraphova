type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  msg:      string;
  [key: string]: unknown;
}

function log(level: LogLevel, payload: LogPayload) {
  const entry = {
    ts:    new Date().toISOString(),
    level,
    ...payload,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info:  (payload: LogPayload) => log('info',  payload),
  warn:  (payload: LogPayload) => log('warn',  payload),
  error: (payload: LogPayload) => log('error', payload),
};
