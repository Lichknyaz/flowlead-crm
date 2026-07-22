import type { Lead } from '../types/lead'

const event = (id: string, label: string, detail: string, timestamp: string, tone: 'blue' | 'green' | 'amber' | 'gray') => ({ id, label, detail, timestamp, tone })

export const mockLeads: Lead[] = [
  {
    id: 'FL-1048', createdAt: '2026-07-22T08:42:00.000Z', clientName: 'Anna Novak', phone: '+420 731 204 118', email: 'anna.novak@example.com', serviceType: 'Plumbing repair', urgency: 'Urgent', location: 'Prague 6 — Dejvice', preferredDate: '2026-07-22', message: 'Water is leaking under the kitchen sink. I have turned off the local valve, but need someone today if possible.', status: 'new', notes: '', assignedUser: 'Unassigned',
    timeline: [event('e1', 'Request received', 'Website form submitted', 'Today, 10:42', 'blue'), event('e2', 'Telegram notification sent', 'Delivered to the service team channel', 'Today, 10:42', 'green')]
  },
  {
    id: 'FL-1047', createdAt: '2026-07-22T07:18:00.000Z', clientName: 'Peter Svoboda', phone: '+420 777 310 882', email: 'peter.s@example.com', serviceType: 'Appliance installation', urgency: 'Standard', location: 'Prague 3 — Žižkov', preferredDate: '2026-07-25', message: 'New integrated dishwasher needs to be connected and checked.', status: 'contacted', notes: 'Called at 09:30. Photos received by email.', assignedUser: 'Jakub M.',
    timeline: [event('e3', 'Request received', 'Website form submitted', 'Today, 09:18', 'blue'), event('e4', 'Client contacted', 'Status updated by Jakub M.', 'Today, 09:34', 'green')]
  },
  {
    id: 'FL-1046', createdAt: '2026-07-21T14:25:00.000Z', clientName: 'Iryna Melnyk', phone: '+420 608 195 447', email: 'iryna.m@example.com', serviceType: 'Furniture assembly', urgency: 'Soon', location: 'Prague 7 — Holešovice', preferredDate: '2026-07-24', message: 'Assembly of two wardrobes and one desk from IKEA.', status: 'booked', notes: 'Booked for Friday, 14:00. Building parking is available.', assignedUser: 'Tomáš K.',
    timeline: [event('e5', 'Request received', 'Website form submitted', 'Yesterday, 16:25', 'blue'), event('e6', 'Visit booked', 'Friday at 14:00', 'Yesterday, 17:10', 'green')]
  },
  {
    id: 'FL-1045', createdAt: '2026-07-21T09:06:00.000Z', clientName: 'Martin Dvořák', phone: '+420 602 883 741', email: 'martin.d@example.com', serviceType: 'Electrical issue', urgency: 'Urgent', location: 'Prague 2 — Vinohrady', preferredDate: '2026-07-21', message: 'Several wall sockets stopped working after the breaker tripped.', status: 'in progress', notes: 'Technician on site. Replacement outlet may be required.', assignedUser: 'Jakub M.',
    timeline: [event('e7', 'Request received', 'Website form submitted', 'Yesterday, 11:06', 'blue'), event('e8', 'Work started', 'Technician checked in on site', 'Yesterday, 13:20', 'amber')]
  },
  {
    id: 'FL-1044', createdAt: '2026-07-19T11:30:00.000Z', clientName: 'Olena Shevchenko', phone: '+420 725 009 331', email: 'olena.s@example.com', serviceType: 'Small renovation', urgency: 'Standard', location: 'Prague 4 — Nusle', preferredDate: '2026-07-20', message: 'Patch and repaint one bedroom wall after shelves were removed.', status: 'completed', notes: 'Completed. Invoice sent and paid.', assignedUser: 'Tomáš K.',
    timeline: [event('e9', 'Request received', 'Website form submitted', '19 Jul, 13:30', 'blue'), event('e10', 'Job completed', 'Invoice PHF-229 issued', '20 Jul, 17:45', 'green')]
  },
  {
    id: 'FL-1043', createdAt: '2026-07-18T13:40:00.000Z', clientName: 'David Brown', phone: '+420 739 212 009', email: 'david.b@example.com', serviceType: 'Emergency repair', urgency: 'Urgent', location: 'Prague 1 — Nové Město', preferredDate: '2026-07-18', message: 'Front door lock is jammed and cannot be secured.', status: 'lost', notes: 'Client found an emergency locksmith before callback.', assignedUser: 'Jakub M.',
    timeline: [event('e11', 'Request received', 'Website form submitted', '18 Jul, 15:40', 'blue'), event('e12', 'Lead closed', 'Client no longer needs service', '18 Jul, 16:35', 'gray')]
  }
]
