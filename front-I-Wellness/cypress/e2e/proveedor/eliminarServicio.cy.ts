describe('Eliminar un servicio después de login', () => {
  beforeEach(() => {
    cy.loginProveedor();
  });

  it('Debe redirigir a la página de edición del último servicio', () => {
    cy.get('button.delete-btn').last().click();

    cy.contains('button', 'Sí, eliminar').click();

    cy.contains('button', 'Aceptar').click();

    // Validar algo después de guardar (mensaje, url, etc)
    // Ejemplo: verificar que redirige a la lista de servicios
    cy.url().should('include', 'http://localhost:4200/homeproveedor');
  });
});
