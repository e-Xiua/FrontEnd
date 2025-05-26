describe('Cambiar el estado de un servicio después de login', () => {
  beforeEach(() => {
    cy.loginProveedor();
  });

  it('Debe cambiar el estado a inactivo del ultimo servicio', () => {
    cy.get('label.switch input[type="checkbox"]').last().uncheck({ force: true });

    cy.contains('button', 'Aceptar').click();
  });
});
