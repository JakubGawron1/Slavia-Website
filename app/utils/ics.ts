/**
 * Prosty generator ICS dla pojedynczego wydarzenia.
 */
export function generateIcsContent(event: {
  title: string
  date: string
  location?: string
  description?: string
  time?: string
}) {
  const dtStart = event.date.replace(/-/g, '') + 'T000000'
  const dtEnd = event.date.replace(/-/g, '') + 'T235959'
  
  // Jeśli mamy time np. "15:00 - 18:00"
  let startStr = dtStart
  let endStr = dtEnd
  
  if (event.time && event.time.includes('-')) {
    const parts = event.time.split('-').map(s => s.trim())
    if (parts.length === 2 && parts[0] && parts[1]) {
      const startH = parts[0].replace(':', '') + '00'
      const endH = parts[1].replace(':', '') + '00'
      startStr = event.date.replace(/-/g, '') + 'T' + startH
      endStr = event.date.replace(/-/g, '') + 'T' + endH
    }
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Slavia Ruda Slaska//NONSGML v1.0//PL',
    'BEGIN:VEVENT',
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location || ''}`,
    `DESCRIPTION:${event.description || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  return lines.join('\r\n')
}

export function downloadIcs(title: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
