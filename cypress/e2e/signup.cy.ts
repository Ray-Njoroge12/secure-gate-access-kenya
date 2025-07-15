describe('Resident Sign Up Flow', () => {
  it('allows a new resident to sign up', () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    cy.visit('/');
    // Wait for the sign-in form to be visible
    cy.get('form').should('exist');
    // Try to click the Sign Up tab by role or text
    cy.get('[role="tab"]').contains(/sign up/i).click({ force: true });
    cy.get('input[placeholder="Enter your full name"]').type('Cypress Test User');
    cy.get('input[placeholder="e.g., 15B, 302, etc."]').type('CYP-101');
    cy.get('input[placeholder="Enter your email"]').type(uniqueEmail);
    cy.get('input[placeholder="Create a password"]').type('TestPassword123!');
    cy.contains('button', /Sign Up/i).click();
    // Expect a toast or message about email verification
    cy.contains(/check your email/i, { timeout: 10000 }).should('exist');
  });
});