describe('Ver informacion un servicio después de login', () => {
  beforeEach(() => {
    cy.loginTurista();
  });

  it('Debe redirigir a la página de informacion del primer servicio', () => {
    // Encuentra todos los botones con clase edit-btn y haz clic en el último
    cy.get('.card-container div').first().click();

    cy.url().should('include', 'http://localhost:4200/infoservicio/');

  });
});
