export const unwrap = (response, preferredKey) => {
  const body = response?.data ?? response ?? {};
  const payload = body.data ?? body;
  if (preferredKey && payload?.[preferredKey] !== undefined) return payload[preferredKey];
  return payload;
};

export const asList = (response, preferredKey) => {
  const value = unwrap(response, preferredKey);
  if (Array.isArray(value)) return value;
  for (const key of ['items', 'rows', 'results', 'records', preferredKey]) if (Array.isArray(value?.[key])) return value[key];
  return [];
};

export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.status === 403) return 'You do not have permission to perform this action.';
  if (error?.response?.status === 404) return 'The requested record was not found.';
  if (error?.response?.status >= 500) return 'The server could not complete the request. Please try again.';
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
};

export const money = (value) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(Number(value || 0));
export const shortDate = (value) => value ? new Intl.DateTimeFormat('en-TZ', { dateStyle: 'medium' }).format(new Date(value)) : '—';
export const today = () => new Date().toISOString().slice(0, 10);
