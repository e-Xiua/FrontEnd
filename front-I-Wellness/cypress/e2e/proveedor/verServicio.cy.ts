describe('Ver informacion un servicio después de login', () => {
  beforeEach(() => {
    cy.loginProveedor();
  });

  it('Debe redirigir a la página de informacion del último servicio', () => {
    // Encuentra todos los botones con clase edit-btn y haz clic en el último
    cy.get('button.visibility-btn').last().click();

    // Verifica que redirige a la ruta de edición
    cy.url().should('include', '/infoservicio/');

  });
});
