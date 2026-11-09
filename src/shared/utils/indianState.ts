/**
 * iOS and Android reverse geocoders do not return Indian states consistently:
 * iOS can return an ISO/vehicle abbreviation (for example, "PB") while
 * Android generally returns the full name. Store one canonical full name.
 */
const STATE_ALIASES: Record<string, string> = {
  'AN': 'Andaman and Nicobar Islands',
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CH': 'Chandigarh',
  'CG': 'Chhattisgarh',
  'CT': 'Chhattisgarh',
  'DD': 'Dadra and Nagar Haveli and Daman and Diu',
  'DL': 'Delhi',
  'DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HP': 'Himachal Pradesh',
  'HR': 'Haryana',
  'JH': 'Jharkhand',
  'JK': 'Jammu and Kashmir',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'LA': 'Ladakh',
  'LD': 'Lakshadweep',
  'MH': 'Maharashtra',
  'ML': 'Meghalaya',
  'MN': 'Manipur',
  'MP': 'Madhya Pradesh',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OD': 'Odisha',
  'OR': 'Odisha',
  'PB': 'Punjab',
  'PY': 'Puducherry',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TG': 'Telangana',
  'TN': 'Tamil Nadu',
  'TR': 'Tripura',
  'TS': 'Telangana',
  'UK': 'Uttarakhand',
  'UP': 'Uttar Pradesh',
  'WB': 'West Bengal',
};

export function normalizeIndianState(value?: string | null): string {
  const state = String(value ?? '').trim();
  if (!state) return '';

  const code = state
    .replace(/^IN[-\s]?/i, '')
    .replace(/[^a-z]/gi, '')
    .toUpperCase();

  return STATE_ALIASES[code] ?? state;
}
