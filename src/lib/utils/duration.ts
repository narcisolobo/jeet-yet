function minutesToISODuration(minutes: string | undefined): string | undefined {
  if (!minutes) return undefined;

  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return undefined;

  return `PT${value}M`;
}

export { minutesToISODuration };
