describe('Editar un servicio después de login', () => {
  beforeEach(() => {
    cy.loginProveedor();
  });

  it('Debe redirigir a la página de edición del último servicio', () => {
    // Encuentra todos los botones con clase edit-btn y haz clic en el último
    cy.get('button.edit-btn').last().click();

    // Verifica que redirige a la ruta de edición
    cy.url().should('include', '/editarservicio/');

   // Cambiar el nombre del servicio
    cy.get('input#nombre')
      .clear()
      .type('Nuevo Nombre del Servicio');

    // Guardar servicio
    cy.get('button.save-btn').click();

    cy.contains('button', 'Aceptar').click();

    // Validar algo después de guardar (mensaje, url, etc)
    // Ejemplo: verificar que redirige a la lista de servicios
    cy.url().should('include', 'http://localhost:4200/homeproveedor');
  });
});
