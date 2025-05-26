describe('Registro de Proveedor', () => {
  it('Debería registrar un nuevo turista correctamente', () => {
    cy.visit('http://localhost:4200/registro');

    // 1. Hacer clic en "Soy Empresa"
    cy.contains('button', 'Soy Empresa').click();

    // 2. Esperar que esté en la ruta correcta
    cy.url().should('include', 'http://localhost:4200/registroproveedor');

    // 3. Llenar formulario
    cy.get('input[placeholder="Nombre"]').type('Juan Pérez');

    cy.get('input[placeholder="Cargo de contacto"]').type('Gerente');

    // Teléfono (usa componente ngx-intl-tel-input, selecciona país y número)
    cy.get('input[placeholder="2212 3456"]').first().type('88881234');

    cy.get('input[placeholder="Contraseña"]').type('Contrasena1.');
    cy.get('input[placeholder="Repite tu contraseña"]').type('Contrasena1.');

    // Datos empresa
    cy.get('input[placeholder="Empresa"]').type('Hotel prueba');

    cy.get('input[placeholder="Email"]').type('proveedor@example.com');

    cy.get('.custom').eq(1).type('88881234');

    // Foto de la persona
    const fileName = 'foto-ejemplo.jpg';
    cy.fixture(fileName).then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent,
        fileName: 'foto-ejemplo.jpg',
        mimeType: 'image/jpeg',
      });
    });

    // Buscar dirección
    cy.get('#search-box').type('San José, Costa Rica{enter}');

    // Espera resultados y selecciona uno (ajustar según lógica real)
    cy.wait(2000);
    cy.get('select').select(1); // Selecciona el primer resultado válido
    // 4. Click en crear cuenta
    cy.contains('button', 'Crear cuenta').click();

    // 5. dirigir al formulario de gustos
    cy.url().should('include', 'http://localhost:4200/homeproveedor');


  });
});
