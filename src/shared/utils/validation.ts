const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;

export const sanitizeEmailInput = (value: string) => value.replace(/^\s+/, '');

export const isValidOptionalEmail = (value: string) => {
  const normalized = sanitizeEmailInput(value);
  if (!normalized) return true;
  if (normalized !== normalized.trim()) return false;
  if (/\s/.test(normalized)) return false;
  return EMAIL_REGEX.test(normalized);
};

export const normalizeGstOrPanNumber = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 15);

export const isValidOptionalGstOrPanNumber = (value: string) => {
  const normalized = normalizeGstOrPanNumber(value);
  if (!normalized) return true;
  return PAN_REGEX.test(normalized) || GSTIN_REGEX.test(normalized);
};
