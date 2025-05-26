describe('Registro de Turista', () => {
  it('Debería registrar un nuevo turista correctamente', () => {
    cy.visit('http://localhost:4200/registro');

    // 1. Hacer clic en "Soy Visitante"
    cy.contains('button', 'Soy Visitante').click();

    // 2. Esperar que esté en la ruta correcta
    cy.url().should('include', 'http://localhost:4200/registroturista');

    // 3. Llenar formulario
    cy.get('input[placeholder="Nombre"]').type('Juan Pérez');

    cy.get('input[placeholder="Correo"]').type('prueba@example.com');

    // Teléfono (usa componente ngx-intl-tel-input, selecciona país y número)
    cy.get('input[placeholder="2212 3456"]').type('88881234');

    cy.get('input[placeholder="Contraseña"]').type('Contrasena1.');
    cy.get('input[placeholder="Repite tu contraseña"]').type('Contrasena1.');

    // Seleccionar país y ciudad
    cy.get('select#country').select('Colombia');
    cy.get('select#city').select('Bogotá D.C.');

    // Género
    cy.get('select#genero').select('Masculino');

    // Fecha de nacimiento
    cy.get('input[type="date"]').type('1990-05-20');

    // Estado civil
    cy.get('select#estadoCivil').select('Soltero/a');

    // 4. Click en crear cuenta
    cy.contains('button', 'Crear cuenta').click();

    // 5. Hacer clic en "Soy Visitante"
    cy.contains('button', 'Aceptar').click();

    // 6. dirigir al formulario de gustos
    cy.url().should('include', 'http://localhost:4200/formulariogustos');

    // 7. Seleccionar al menos 3 gustos (suponiendo que se muestran como botones o tarjetas clicables)
    cy.get('.card') // Ajusta el selector al que usas (puede ser .card, .item, etc.)
      .should('have.length.at.least', 5) // Asegura que haya suficientes
      .then((items) => {
        // Selecciona los primeros tres
        cy.wrap(items[0]).click();
        cy.wrap(items[1]).click();
        cy.wrap(items[2]).click();
      });

    // 8. Hacer clic en "Guardar preferencias"
    cy.contains('button', 'Siguiente').click(); // Ajusta el texto si es distinto

    // 9. Verificar que aparece SweetAlert y se redirige a /hometurista
    cy.contains('Preferencias guardadas'); // Verifica que aparece mensaje
    cy.contains('button', 'Continuar').click(); // Aceptar SweetAlert

    // 10. Verifica redirección final
    cy.url().should('include', '/hometurista');

  });
});
