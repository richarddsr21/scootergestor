export function bucketByDay<T>(
  items: T[],
  getDate: (item: T) => string,
  getValue: (item: T) => number,
  days: number,
  endDate: Date = new Date()
): { date: string; total: number }[] {
  const buckets: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = 0
  }

  for (const item of items) {
    const key = getDate(item).slice(0, 10)
    if (key in buckets) buckets[key] += getValue(item)
  }

  return Object.entries(buckets).map(([date, total]) => ({ date, total }))
}
