import 'cypress-file-upload';

Cypress.Commands.add('loginProveedor', () => {
  cy.visit('http://localhost:4200/login'); // o la ruta de login de tu app
  cy.get('input[placeholder="Correo"]').type('mariana.torres@costadelsolhotel.co');
  cy.get('input[placeholder="Contraseña"]').type('Contrasena1.');
  cy.get('button[type="submit"]').click();
  // espera o verifica que login fue exitoso, por ejemplo:
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('loginTurista', () => {
  cy.visit('http://localhost:4200/login'); // o la ruta de login de tu app
  cy.get('input[placeholder="Correo"]').type('juan_hernandezr@javeriana.edu.co');
  cy.get('input[placeholder="Contraseña"]').type('Contrasena1.');
  cy.get('button[type="submit"]').click();
  // espera o verifica que login fue exitoso, por ejemplo:
  cy.url().should('not.include', '/login');
});

declare global {
    namespace Cypress {
        interface Chainable<Subject = any> {
            loginProveedor(): Chainable<any>;
            loginTurista(): Chainable<any>;
        }
    }
} 


/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }