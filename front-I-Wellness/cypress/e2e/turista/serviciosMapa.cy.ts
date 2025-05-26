describe('Elegir una empresa del mapa y ver sus servicios', () => {
  beforeEach(() => {
    cy.loginTurista();
    cy.visit('http://localhost:4200/mapaempresas');
  });

it('Hace clic en un marcador del mapa y va al detalle del proveedor', () => {

  // Esperar a que se carguen los marcadores y el mapa
  cy.wait(2000); // Ajusta según carga real

  cy.get('.leaflet-marker-icon').first().click({ force: true });

    // Esperar que el popup aparezca
    cy.get('.popup-card a').should('be.visible').click({ force: true });

  cy.url().should('include', 'http://localhost:4200/proveedor/');

});

});
