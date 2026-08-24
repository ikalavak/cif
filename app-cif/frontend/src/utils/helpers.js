export function formatDateISO(date) {
  try {
    return new Date(date).toISOString();
  } catch (e) {
    return null;
  }
}

export function noop() {}
