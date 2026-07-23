import { CalendarDays, Mail, MapPin, Phone, UserRound, Wrench, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useLeads } from '../context/LeadDataContext'
import type { Lead, LeadFormData, Urgency } from '../types/lead'

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter the client name'),
    phone: z.string(),
    email: z.string(),
    serviceType: z.string().min(1, 'Choose a service'),
    urgency: z.enum(['Standard', 'Soon', 'Urgent']),
    location: z.string().min(2, 'Enter the service address'),
    preferredDate: z.string(),
    message: z.string().min(12, 'Add a short request description'),
  })
  .superRefine((data, context) => {
    if (!data.phone.trim() && !data.email.trim()) {
      context.addIssue({ code: 'custom', path: ['phone'], message: 'Add a phone number or email' })
    }
    if (data.email && !z.string().email().safeParse(data.email).success) {
      context.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid email' })
    }
  })

const initialForm: LeadFormData = {
  fullName: '',
  phone: '',
  email: '',
  serviceType: '',
  urgency: 'Standard',
  location: '',
  preferredDate: '',
  message: '',
}

export function NewLeadModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (lead: Lead) => void
}) {
  const { addLead } = useLeads()
  const [form, setForm] = useState<LeadFormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])

  if (!open) return null

  const update = (key: keyof LeadFormData, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError('')
    const result = schema.safeParse(form)
    if (!result.success) {
      const nextErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0])] = issue.message
      })
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const lead = await addLead({ ...result.data, source: 'crm' })
      setForm(initialForm)
      setErrors({})
      onCreated(lead)
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Unable to create this lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="crm-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="crm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-lead-title"
      >
        <header>
          <div>
            <span className="crm-modal-icon">
              <UserRound />
            </span>
            <div>
              <h2 id="new-lead-title">Add a new lead</h2>
              <p>Create a request without leaving the CRM workspace.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close new lead dialog">
            <X />
          </button>
        </header>
        <form onSubmit={submit} noValidate>
          <div className="crm-form-grid">
            <label className="full">
              Client name *
              <div className="crm-input-icon">
                <UserRound />
                <input
                  value={form.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                  placeholder="Anna Novak"
                  autoFocus
                />
              </div>
              {errors.fullName && <em>{errors.fullName}</em>}
            </label>
            <label>
              Phone
              <div className="crm-input-icon">
                <Phone />
                <input
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  placeholder="+420 700 000 000"
                />
              </div>
              {errors.phone && <em>{errors.phone}</em>}
            </label>
            <label>
              Email
              <div className="crm-input-icon">
                <Mail />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              {errors.email && <em>{errors.email}</em>}
            </label>
            <label>
              Service *
              <div className="crm-input-icon">
                <Wrench />
                <select
                  value={form.serviceType}
                  onChange={(event) => update('serviceType', event.target.value)}
                >
                  <option value="">Select service</option>
                  <option>Plumbing repair</option>
                  <option>Electrical issue</option>
                  <option>Furniture assembly</option>
                  <option>Appliance installation</option>
                  <option>Small renovation</option>
                  <option>Emergency repair</option>
                </select>
              </div>
              {errors.serviceType && <em>{errors.serviceType}</em>}
            </label>
            <label>
              Urgency
              <select
                value={form.urgency}
                onChange={(event) => update('urgency', event.target.value as Urgency)}
              >
                <option>Standard</option>
                <option>Soon</option>
                <option>Urgent</option>
              </select>
            </label>
            <label className="full">
              Service address *
              <div className="crm-input-icon">
                <MapPin />
                <input
                  value={form.location}
                  onChange={(event) => update('location', event.target.value)}
                  placeholder="Street, district or postcode"
                />
              </div>
              {errors.location && <em>{errors.location}</em>}
            </label>
            <label>
              Preferred date
              <div className="crm-input-icon">
                <CalendarDays />
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(event) => update('preferredDate', event.target.value)}
                />
              </div>
            </label>
            <label className="full crm-message-field">
              Request details *
              <textarea
                rows={4}
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                placeholder="Describe the problem and any useful access details..."
              />
              {errors.message && <em>{errors.message}</em>}
            </label>
          </div>
          {submitError && (
            <p className="access-error" role="alert">
              {submitError}
            </p>
          )}
          <footer>
            <button className="button button-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating lead…' : 'Create lead'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
