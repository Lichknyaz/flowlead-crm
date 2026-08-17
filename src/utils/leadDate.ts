const PRAGUE_TIME_ZONE = 'Europe/Prague'

export const pragueDateKey = (value: string | Date) =>
  new Date(value).toLocaleDateString('sv-SE', { timeZone: PRAGUE_TIME_ZONE })

const pragueTime = (value: string | Date) =>
  new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: PRAGUE_TIME_ZONE,
  })

const dayNumber = (key: string) => Date.parse(`${key}T00:00:00.000Z`)

export const formatLeadReceivedAt = (value: string, now = new Date()) => {
  const date = new Date(value)
  const dateKey = pragueDateKey(date)
  const todayKey = pragueDateKey(now)
  const daysAgo = Math.round((dayNumber(todayKey) - dayNumber(dateKey)) / 86_400_000)

  if (daysAgo === 0) return `Today, ${pragueTime(date)}`
  if (daysAgo === 1) return `Yesterday, ${pragueTime(date)}`

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(dateKey.slice(0, 4) === todayKey.slice(0, 4) ? {} : { year: 'numeric' }),
    timeZone: PRAGUE_TIME_ZONE,
  })
}

export const formatLeadReceivedTitle = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: PRAGUE_TIME_ZONE,
  })

export const periodStartKey = (period: 'week' | 'month', now = new Date()) => {
  const todayKey = pragueDateKey(now)
  if (period === 'month') return `${todayKey.slice(0, 7)}-01`

  const monday = new Date(`${todayKey}T00:00:00.000Z`)
  const daysFromMonday = (monday.getUTCDay() + 6) % 7
  monday.setUTCDate(monday.getUTCDate() - daysFromMonday)
  return monday.toISOString().slice(0, 10)
}
