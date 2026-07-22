import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ArrowLeft, CalendarDays, Check, Clock3, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { PublicHeader } from '../components/PublicHeader'
import { useLeads } from '../context/LeadContext'
import type { LeadFormData, Urgency } from '../types/lead'

const schema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  phone: z.string(),
  email: z.string(),
  serviceType: z.string().min(1, 'Please choose a service'),
  urgency: z.enum(['Standard', 'Soon', 'Urgent']),
  location: z.string().min(2, 'Please enter the service address'),
  preferredDate: z.string(),
  message: z.string().min(12, 'Please add a little more detail'),
}).superRefine((data, ctx) => {
  if (!data.phone.trim() && !data.email.trim()) ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Add a phone number or email' })
  if (data.email && !z.string().email().safeParse(data.email).success) ctx.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid email address' })
})

const initial: LeadFormData = { fullName: '', phone: '', email: '', serviceType: '', urgency: 'Standard', location: '', preferredDate: '', message: '' }

export function RequestPage() {
  const [form, setForm] = useState<LeadFormData>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addLead } = useLeads()
  const navigate = useNavigate()
  const update = (key: keyof LeadFormData, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = schema.safeParse(form)
    if (!result.success) {
      const next: Record<string, string> = {}
      result.error.issues.forEach((issue) => { next[String(issue.path[0])] = issue.message })
      setErrors(next)
      return
    }
    const lead = addLead(result.data)
    navigate('/request/success', { state: { id: lead.id, name: lead.clientName } })
  }
  return (
    <div className="public-page request-page">
      <PublicHeader />
      <main className="request-main container">
        <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Back to website</button>
        <div className="request-layout">
          <section className="request-intro">
            <span className="eyebrow">REQUEST A REPAIR</span>
            <h1>Tell us what needs fixing.</h1>
            <p>Share a few details and our Prague team will review your request and get back to you with the next step.</p>
            <div className="response-card"><Clock3 /><span><strong>Typical response</strong><small>Within 30 minutes during business hours</small></span></div>
            <ul className="trust-list"><li><Check /> No call-out fee to request a quote</li><li><Check /> Vetted local technicians</li><li><Check /> Clear pricing before work begins</li></ul>
            <div className="help-card"><strong>Need urgent help?</strong><p>Call our service desk directly.</p><a href="tel:+420212345678"><Phone size={17} /> +420 212 345 678</a></div>
          </section>
          <form className="lead-form" onSubmit={submit} noValidate>
            <div className="form-heading"><span>1</span><div><h2>Your contact details</h2><p>How can we reach you?</p></div></div>
            <div className="form-grid">
              <label className="full">Full name *<input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="e.g. Anna Novak" />{errors.fullName && <em>{errors.fullName}</em>}</label>
              <label>Phone number<div className="input-icon"><Phone /><input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+420 700 000 000" /></div>{errors.phone && <em>{errors.phone}</em>}</label>
              <label>Email address<div className="input-icon"><Mail /><input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" /></div>{errors.email && <em>{errors.email}</em>}</label>
            </div>
            <div className="form-divider" />
            <div className="form-heading"><span>2</span><div><h2>What do you need?</h2><p>Help us send the right technician.</p></div></div>
            <div className="form-grid">
              <label>Service type *<select value={form.serviceType} onChange={(e) => update('serviceType', e.target.value)}><option value="">Select a service</option><option>Plumbing repair</option><option>Electrical issue</option><option>Furniture assembly</option><option>Appliance installation</option><option>Small renovation</option><option>Emergency repair</option></select>{errors.serviceType && <em>{errors.serviceType}</em>}</label>
              <label>Preferred date<div className="input-icon"><CalendarDays /><input type="date" value={form.preferredDate} onChange={(e) => update('preferredDate', e.target.value)} /></div></label>
              <fieldset className="full urgency-field"><legend>How urgent is it?</legend>{(['Standard', 'Soon', 'Urgent'] as Urgency[]).map((item) => <button type="button" className={form.urgency === item ? 'selected' : ''} onClick={() => update('urgency', item)} key={item}><i />{item}<small>{item === 'Standard' ? 'Within a week' : item === 'Soon' ? 'Next 1–2 days' : 'As soon as possible'}</small></button>)}</fieldset>
              <label className="full">Service address *<div className="input-icon"><MapPin /><input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Street, district or postcode" /></div>{errors.location && <em>{errors.location}</em>}</label>
              <label className="full">Describe the problem *<textarea value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="What happened? Add any useful details..." rows={5} /><small className="char-count">{form.message.length}/500</small>{errors.message && <em>{errors.message}</em>}</label>
            </div>
            <button className="button button-primary button-submit" type="submit">Send my request <span>→</span></button>
            <p className="privacy-note"><ShieldCheck size={16} /> Your details are used only to handle this service request.</p>
          </form>
        </div>
      </main>
    </div>
  )
}
