export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

export function asObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value.data && typeof value.data === 'object' && !Array.isArray(value.data) ? value.data : value;
  return {};
}

export function getApiMessage(error, fallback='Request failed. Please try again.') {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

export function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat('en-TZ', { style:'currency', currency:'TZS', maximumFractionDigits:2 }).format(number);
}

export function displayName(user) { return user?.name || user?.full_name || user?.email || 'User'; }
