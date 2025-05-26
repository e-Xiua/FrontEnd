describe('Inicio de sesión - Turista', () => {
  it('debería iniciar sesión correctamente y redirigir al home del turista', () => {
    cy.visit('http://localhost:4200/login');

    // Rellenar los campos
    cy.get('input[name="correo"]').type('juan_hernandezr@javeriana.edu.co');
    cy.get('input[name="password"]').type('Contrasena1.');

    // Enviar el formulario
    cy.get('button[type="submit"]').click();

    // Esperar que la url cambie (redirección)
    cy.url().should('include', '/hometurista');
  });
});
