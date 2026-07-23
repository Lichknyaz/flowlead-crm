import type { Lead } from '../types/lead'

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`

const leadsToCsv = (leads: Lead[]) => {
  const headers = [
    'Reference',
    'Created',
    'Client',
    'Phone',
    'Email',
    'Service',
    'Urgency',
    'Status',
    'Location',
    'Preferred date',
    'Assigned to',
    'Message',
    'Notes',
  ]
  const rows = leads.map((lead) => [
    lead.id,
    lead.createdAt,
    lead.clientName,
    lead.phone,
    lead.email,
    lead.serviceType,
    lead.urgency,
    lead.status,
    lead.location,
    lead.preferredDate,
    lead.assignedUser,
    lead.message,
    lead.notes,
  ])
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

export const createLeadsCsvHref = (leads: Lead[]) =>
  `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${leadsToCsv(leads)}`)}`
