describe('Ver información de un servicio y hacer una reserva después de login', () => {
  beforeEach(() => {
    cy.loginTurista();
  });

  it('Debe redirigir a la página de información y realizar una reserva', () => {
    // Da clic en la primera tarjeta de servicio
    cy.get('.card-container div').first().click();

    // Espera que la URL contenga /infoservicio/
    cy.url().should('include', '/infoservicio/');

    // Espera a que cargue la página
    cy.contains('Reservar', { timeout: 10000 }).should('be.visible');

    // Selecciona una fecha y hora si existe un input tipo date y time
    // Ajusta los selectores según tu implementación real
    cy.get('mat-datepicker-toggle button').click();

    // Espera a que se cargue y selecciona el primer día disponible (no deshabilitado)
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled) .mat-calendar-body-cell-content')
      .first()
      .click({ force: true });

    cy.get('body').click(0, 0); // hace clic en la esquina superior izquierda

    // Espera a que se cierre
    cy.wait(500);


    // Extraer la hora de apertura del texto
    cy.get('p.service-hours')
      .invoke('text')
      .then((text) => {
        // Extraer la hora después del ;
        const horaApertura = text.split(';')[1]?.trim().split(' - ')[0];
        cy.log('Hora de apertura:', horaApertura);

      cy.get('mat-form-field').contains('Selecciona una hora')
        .parent()
        .find('input[matinput]')
        .clear()
        .type(horaApertura, { force: true });
      });

    cy.get('body').click(0, 0); // hace clic en la esquina superior izquierda

    // Espera a que se cierre
    cy.wait(500);

    // Haz clic en el botón Reservar
    cy.get('button.btn-reservar').click();

    cy.contains('button', 'Aceptar').click();
  });
});
