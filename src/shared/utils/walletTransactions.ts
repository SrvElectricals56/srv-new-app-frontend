/** The wallet ledger is authoritative. Do not merge scan/redemption events as extra payments. */
export function uniqueWalletTransactions<T extends { id: string; rawDate?: string }>(rows: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of rows) if (!byId.has(row.id)) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => (Date.parse(b.rawDate ?? '') || 0) - (Date.parse(a.rawDate ?? '') || 0));
}
