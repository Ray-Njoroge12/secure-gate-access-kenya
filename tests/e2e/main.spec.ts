import { test, expect } from '@playwright/test'

test.describe('Secure Gate Access - E2E Tests', () => {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL)
  })

  test.describe('Authentication Flow', () => {
    test('should display login form on unauthorized access', async ({ page }) => {
      await expect(page).toHaveTitle(/Secure Gate Access/i)
      await expect(page.locator('form')).toBeVisible()
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test('should show validation errors for invalid login', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid@email.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('.error-message')).toBeVisible()
    })

    test('should redirect to dashboard on successful login', async ({ page }) => {
      // Use test credentials
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword')
      await page.click('button[type="submit"]')
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/i)
      await expect(page.locator('h1')).toContainText('Dashboard')
    })
  })

  test.describe('Visitor Registration', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto(`${baseURL}/auth`)
      await page.fill('input[type="email"]', 'security@example.com')
      await page.fill('input[type="password"]', 'securepassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/dashboard/)
    })

    test('should register a new visitor', async ({ page }) => {
      await page.goto(`${baseURL}/visitor-registration`)
      
      // Fill visitor form
      await page.fill('input[name="firstName"]', 'John')
      await page.fill('input[name="lastName"]', 'Doe')
      await page.fill('input[name="email"]', 'john.doe@example.com')
      await page.fill('input[name="phoneNumber"]', '+254712345678')
      await page.fill('input[name="purposeOfVisit"]', 'Business Meeting')
      await page.fill('input[name="hostName"]', 'Jane Smith')
      
      await page.click('button[type="submit"]')
      
      // Verify success message
      await expect(page.locator('.success-message')).toBeVisible()
      await expect(page.locator('.success-message')).toContainText('Visitor registered successfully')
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${baseURL}/visitor-registration`)
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Check for validation errors
      await expect(page.locator('.field-error')).toHaveCount(5) // 5 required fields
    })

    test('should check in a visitor', async ({ page }) => {
      await page.goto(`${baseURL}/security-guard`)
      
      // Search for visitor
      await page.fill('input[placeholder*="search"]', 'john.doe@example.com')
      await page.press('input[placeholder*="search"]', 'Enter')
      
      // Check in visitor
      await page.click('button:has-text("Check In")')
      
      // Verify check-in success
      await expect(page.locator('.visitor-status')).toContainText('Checked In')
    })

    test('should check out a visitor', async ({ page }) => {
      await page.goto(`${baseURL}/security-guard`)
      
      // Find checked-in visitor
      await page.fill('input[placeholder*="search"]', 'john.doe@example.com')
      await page.press('input[placeholder*="search"]', 'Enter')
      
      // Check out visitor
      await page.click('button:has-text("Check Out")')
      
      // Verify check-out success
      await expect(page.locator('.visitor-status')).toContainText('Checked Out')
    })
  })

  test.describe('Invitation System', () => {
    test.beforeEach(async ({ page }) => {
      // Login as host
      await page.goto(`${baseURL}/auth`)
      await page.fill('input[type="email"]', 'host@example.com')
      await page.fill('input[type="password"]', 'hostpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/dashboard/)
    })

    test('should create a new invitation', async ({ page }) => {
      await page.goto(`${baseURL}/invitations`)
      
      await page.click('button:has-text("Create Invitation")')
      
      // Fill invitation form
      await page.fill('input[name="visitorEmail"]', 'guest@example.com')
      await page.fill('input[name="hostName"]', 'Host User')
      await page.fill('input[name="scheduledDate"]', '2024-12-25')
      await page.fill('input[name="scheduledTime"]', '14:00')
      await page.fill('textarea[name="purpose"]', 'Business Meeting')
      
      await page.click('button[type="submit"]')
      
      // Verify invitation created
      await expect(page.locator('.success-message')).toContainText('Invitation sent successfully')
      
      // Verify access code generated
      await expect(page.locator('.access-code')).toBeVisible()
    })

    test('should validate access code', async ({ page }) => {
      await page.goto(`${baseURL}/validate-invitation`)
      
      // Enter access code
      await page.fill('input[name="accessCode"]', 'ABC123')
      await page.click('button:has-text("Validate")')
      
      // Should show invitation details or error
      await expect(page.locator('.validation-result')).toBeVisible()
    })
  })

  test.describe('Analytics Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto(`${baseURL}/auth`)
      await page.fill('input[type="email"]', 'admin@example.com')
      await page.fill('input[type="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/dashboard/)
    })

    test('should display visitor analytics', async ({ page }) => {
      await page.goto(`${baseURL}/analytics`)
      
      // Check for analytics cards
      await expect(page.locator('.analytics-card')).toHaveCount(4)
      
      // Verify charts are visible
      await expect(page.locator('.chart-container')).toBeVisible()
      
      // Check for visitor metrics
      await expect(page.locator('[data-testid="total-visitors"]')).toBeVisible()
      await expect(page.locator('[data-testid="checked-in-visitors"]')).toBeVisible()
    })

    test('should filter analytics by date range', async ({ page }) => {
      await page.goto(`${baseURL}/analytics`)
      
      // Set date range
      await page.fill('input[name="startDate"]', '2024-01-01')
      await page.fill('input[name="endDate"]', '2024-12-31')
      await page.click('button:has-text("Apply Filter")')
      
      // Verify data updates
      await expect(page.locator('.analytics-updated')).toBeVisible()
    })
  })

  test.describe('QR Code Functionality', () => {
    test('should generate QR code for visitor', async ({ page }) => {
      await page.goto(`${baseURL}/visitor-registration`)
      
      // Complete visitor registration
      await page.fill('input[name="firstName"]', 'QR')
      await page.fill('input[name="lastName"]', 'Test')
      await page.fill('input[name="email"]', 'qr.test@example.com')
      await page.fill('input[name="phoneNumber"]', '+254700000000')
      await page.fill('input[name="purposeOfVisit"]', 'QR Code Test')
      await page.fill('input[name="hostName"]', 'QR Host')
      
      await page.click('button[type="submit"]')
      
      // Verify QR code is generated
      await expect(page.locator('.qr-code')).toBeVisible()
      await expect(page.locator('canvas')).toBeVisible()
    })

    test('should scan QR code for check-in', async ({ page }) => {
      await page.goto(`${baseURL}/security-guard`)
      
      // Simulate QR code scan
      await page.click('button:has-text("Scan QR Code")')
      
      // Verify scanner interface
      await expect(page.locator('.qr-scanner')).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto(baseURL)
      
      // Check mobile navigation
      await expect(page.locator('.mobile-menu-button')).toBeVisible()
      
      // Test mobile form layout
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto(`${baseURL}/visitor-registration`)
      
      // Test touch scrolling and interactions
      await page.touchscreen.tap(200, 300)
      await page.fill('input[name="firstName"]', 'Touch')
      
      await expect(page.locator('input[name="firstName"]')).toHaveValue('Touch')
    })
  })

  test.describe('Performance', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto(baseURL)
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000) // 5 seconds max
    })

    test('should handle large visitor lists efficiently', async ({ page }) => {
      await page.goto(`${baseURL}/security-guard`)
      
      // Simulate loading large dataset
      await page.route('**/api/visitors**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: Array.from({ length: 1000 }, (_, i) => ({
              id: i,
              first_name: `Visitor${i}`,
              last_name: `Test${i}`,
              email: `visitor${i}@example.com`
            }))
          })
        })
      })
      
      await page.reload()
      
      // Verify virtualization or pagination works
      await expect(page.locator('.visitor-item')).toHaveCountLessThanOrEqual(50)
    })
  })

  test.describe('Accessibility', () => {
    test('should meet WCAG accessibility standards', async ({ page }) => {
      await page.goto(baseURL)
      
      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible()
      
      // Verify form labels
      await expect(page.locator('label[for="email"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()
      
      // Check keyboard navigation
      await page.keyboard.press('Tab')
      await expect(page.locator('input[type="email"]:focus')).toBeVisible()
    })

    test('should support screen readers', async ({ page }) => {
      await page.goto(baseURL)
      
      // Check for ARIA attributes
      await expect(page.locator('[role="main"]')).toBeVisible()
      await expect(page.locator('[aria-label]')).toHaveCount.toBeGreaterThan(0)
    })
  })
})
