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

function isoDurationToMinutes(duration: string | undefined): string | undefined {
  if (!duration) return undefined;

  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(duration);
  if (!match) return undefined;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes > 0 ? String(totalMinutes) : undefined;
}

function formatISODuration(duration: string | undefined): string | undefined {
  if (!duration) return undefined;

  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(duration);
  if (!match) return undefined;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  if (hours === 0 && minutes === 0) return undefined;

  return [hours > 0 ? `${hours} hr` : null, minutes > 0 ? `${minutes} min` : null]
    .filter(Boolean)
    .join(" ");
}

export {
  formatISODuration,
  isoDurationToMinutes,
  minutesToISODuration,
  sumMinutesToISODuration,
};
