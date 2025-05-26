describe('Cancelar última reserva de un proveedor', () => {
  beforeEach(() => {
    cy.loginTurista();
    cy.visit('http://localhost:4200/reservasturista');
    cy.wait(2000); // esperar que todo cargue
  });

  it('Debe seleccionar el primer proveedor, cancelar la última reserva y confirmar', () => {
    // 1. Click en el primer proveedor para abrir su sección
    cy.get('.proveedor-header').first().click();

    // 2. Esperar que aparezcan las reservas (bloques)
    cy.get('.reserva-block').should('exist');

    // 3. Tomar el último bloque de reserva que tenga el botón cancelar visible
    cy.get('.reserva-block').filter(':has(button.btn-cancelar)').last().within(() => {
      // 4. Click en el botón cancelar
      cy.get('button.btn-cancelar').click();
    });

    // 5. Confirmar cancelación (botón "Sí, cancelar")
    cy.contains('button', 'Sí, cancelar').click();

    cy.contains('button', 'OK').click();
    // 6. Verificar que la reserva haya cambiado de estado o desaparecido el botón cancelar
    // (ajusta esta parte según la lógica de tu app)
    cy.get('.reserva-block').filter(':has(button.btn-cancelar)').last().should('not.exist');
  });
});
