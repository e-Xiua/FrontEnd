describe('Crear un servicio después de login', () => {
  beforeEach(() => {
    cy.loginProveedor();
    cy.visit('http://localhost:4200/agregarservicio'); 
  });

  it('Debe llenar el formulario y crear un servicio', () => {
    // Cargar imagen (usa un archivo ejemplo que tengas en cypress/fixtures)
    const imagePath = 'service-test.jpg';  // Pon aquí el nombre de tu imagen de prueba
    cy.get('#imageInput').attachFile(imagePath);

    // Llenar campos de texto
    cy.get('input[placeholder="Nombre"]').type('Servicio de prueba');
    cy.get('textarea[placeholder="Descripción"]').type('Descripción del servicio de prueba');

    // Seleccionar días (checkboxes)
    // Aquí asumimos que tienes 7 días con ids como lunes, martes, etc.
    cy.contains('label', 'Lunes').click();
    cy.contains('label', 'Martes').click();

    // Horario apertura y cierre
    cy.get('input[type="time"]').eq(0).type('08:00'); // Hora apertura
    cy.get('input[type="time"]').eq(1).type('17:00'); // Hora cierre

    // Precio
    cy.get('input[placeholder="Ingresa el precio o 0 si es gratuito"]').type('15000');

    // Seleccionar preferencias (al menos 2, máximo 5)
    // Aquí se seleccionan los primeros dos inputs checkbox dentro de la sección de preferencias
    cy.get('.preferencias-list input[type="checkbox"]').eq(0).check();
    cy.get('.preferencias-list input[type="checkbox"]').eq(1).check();

    // Guardar servicio
    cy.get('button.save-btn').click();

    cy.contains('button', 'OK').click();

    // Validar algo después de guardar (mensaje, url, etc)
    // Ejemplo: verificar que redirige a la lista de servicios
    cy.url().should('include', 'http://localhost:4200/homeproveedor');
  });
});

