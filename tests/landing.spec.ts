import { expect, test } from '@playwright/test'

test.describe('public landing page', () => {
  test('shows the customer journey and primary repair call to action', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/FlowLead CRM — Prague HomeFix/)
    await expect(page.getByRole('heading', { name: /Your home, fixed/i })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Home repair service overview' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /One team for the jobs/i })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /A repair shouldn't create more work/i }),
    ).toBeVisible()

    const requestLink = page.getByRole('link', { name: /Request a repair/i }).first()
    await expect(requestLink).toHaveAttribute('href', '/request')
  })

  test('keeps the desktop navigation and CRM demo route reachable', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mobile navigation is covered by the mobile-menu scenario.')
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/#services')
    await expect(page.getByRole('link', { name: 'How it works' })).toHaveAttribute(
      'href',
      '/#process',
    )
    await expect(page.getByRole('link', { name: 'CRM demo' })).toHaveAttribute('href', '/demo')

    await page.getByRole('link', { name: 'CRM demo' }).click()
    await expect(page).toHaveURL(/\/demo$/)
  })

  test('does not introduce horizontal overflow', async ({ page }) => {
    await page.goto('/')

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true)
    await expect
      .poll(() =>
        page.locator('.hero-copy > p').evaluate((element) => {
          const { right } = element.getBoundingClientRect()
          return right <= window.innerWidth
        }),
      )
      .toBe(true)
  })

  test('smoothly navigates to sections and offers a return to the header', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop navigation is used for this anchor interaction.')
    await page.goto('/')

    await page.getByRole('link', { name: 'Services' }).click()
    await expect(page).toHaveURL(/#services$/)
    await expect(page.locator('#services')).toBeInViewport()
    await expect(page.getByRole('button', { name: 'Return to top' })).toBeVisible()

    await page.getByRole('button', { name: 'Return to top' }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY < 20)).toBe(true)
  })
})

test.describe('public landing page on mobile', () => {
  test('opens navigation and keeps the request route accessible', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This interaction is specific to the mobile menu.')
    await page.goto('/')

    await page.getByRole('button', { name: 'Toggle menu' }).click()
    await expect(page.getByRole('button', { name: 'Toggle menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(navigation.getByRole('link', { name: 'Request a repair' })).toBeVisible()

    await navigation.getByRole('link', { name: 'Request a repair' }).click()
    await expect(page).toHaveURL(/\/request$/)
  })
})
