import { expect, test } from '@playwright/test'

test.describe('local CRM workflow', () => {
  test('carries a customer request through triage, value and a follow-up task', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The full workflow is covered once in the desktop workspace.')

    const clientName = 'E2E Portfolio Client'
    const taskName = 'Call E2E Portfolio Client about the quote'

    await page.goto('/request')

    const requestForm = page.locator('.lead-form')
    await requestForm.getByLabel(/Full name/).fill(clientName)
    await requestForm.getByLabel(/Phone number/).fill('+420 700 123 456')
    await requestForm.getByLabel(/Email address/).fill('e2e@example.test')
    await requestForm.getByLabel(/Service type/).selectOption('Electrical issue')
    await requestForm.getByRole('button', { name: /^Urgent/ }).click()
    await requestForm.getByLabel(/Service address/).fill('Demo Street 17, Prague')
    await requestForm
      .getByLabel(/Describe the problem/)
      .fill('Portfolio workflow verification request.')
    await requestForm.getByRole('button', { name: /Send my request/ }).click()

    await expect(page).toHaveURL(/\/request\/success$/)
    await expect(page.getByRole('heading', { name: /Thanks, E2E/i })).toBeVisible()

    await page.getByRole('link', { name: 'View it in CRM' }).click()
    await expect(page).toHaveURL(/\/dashboard\/leads$/)
    await expect(page.getByText(clientName, { exact: true }).first()).toBeVisible()

    await page.getByText(clientName, { exact: true }).first().click()
    await expect(page).toHaveURL(/\/dashboard\/leads\/FL-\d+$/)

    const statusControl = page.locator('.detail-controls').getByLabel('Status')
    await statusControl.selectOption('booked')
    await expect(statusControl).toHaveValue('booked')

    await page
      .getByPlaceholder('Add useful context, call notes or access information...')
      .fill('E2E note: quote requested before the visit.')
    await page.getByRole('button', { name: 'Save note' }).click()
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible()

    const finance = page.locator('.finance-section')
    await finance.getByLabel('Estimated value').fill('2400')
    await finance.getByRole('button', { name: 'Save value' }).click()
    await expect(finance.getByRole('button', { name: 'Saved' })).toBeVisible()

    await page.getByRole('button', { name: 'Add task' }).click()
    await page.getByLabel('Task').fill(taskName)
    await page.getByRole('button', { name: 'Set reminder' }).click()
    await expect(page.getByText(taskName, { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Overview' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText(taskName, { exact: true })).toBeVisible()
  })
})
