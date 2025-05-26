describe('Inicio de sesión - Turista', () => {
  it('debería iniciar sesión correctamente y redirigir al home del admin', () => {
    cy.visit('http://localhost:4200/login');

    // Rellenar los campos
    cy.get('input[name="correo"]').type('admin@gmail.com');
    cy.get('input[name="password"]').type('admin123');

    // Enviar el formulario
    cy.get('button[type="submit"]').click();

    // Esperar que la url cambie (redirección)
    cy.url().should('include', '/homeadmin');
  });
});
