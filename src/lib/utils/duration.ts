function minutesToISODuration(minutes: string | undefined): string | undefined {
  if (!minutes) return undefined;

  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return undefined;

  return `PT${value}M`;
}

function sumMinutesToISODuration(
  a: string | undefined,
  b: string | undefined,
): string | undefined {
  const total = (Number(a) || 0) + (Number(b) || 0);
  return minutesToISODuration(total > 0 ? String(total) : undefined);
}

export { minutesToISODuration, sumMinutesToISODuration };
