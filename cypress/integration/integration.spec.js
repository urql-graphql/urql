const defaultStore = ['test', 'test2', 'test3'];

const routes = { context: '/', hooks: '/hooks' };

context('Integration', () => {
  Object.entries(routes).forEach(([type, path]) => {
    afterEach(() => {
      cy.get('#reset').click();
    });

    describe(`on page load (${type})`, () => {
      it('executes/loads query', () => {
        cy.visit(path);
        cy.get('p').should('have.text', 'Loading...');
      });

      it('returns query data', () => {
        cy.visit(path);
        cy.get('ul > li').should('have.length', defaultStore.length);
        cy.get('ul > li').each((li, i) =>
          expect(li).to.have.text(`${defaultStore[i]} Remove`)
        );
      });
    });

    describe(`on mutation (${type})`, () => {
      it('updates list after addition', () => {
        const newText = 'Hello Cypress!';
        cy.visit(path);

        // Add new todo
        cy.get('.form input').type(newText);
        cy.get('.form button').click();

        cy.get('ul > li').should('have.length', defaultStore.length + 1);
        cy.get('ul > li > span')
          .last()
          .should('have.text', newText);
      });

      it('updates list after removal', () => {
        cy.visit(path);
        cy.get('ul > li button')
          .first()
          .click();

        cy.get('ul > li').should('have.length', defaultStore.length - 1);
        cy.get('ul > li').each((li, i) =>
          expect(li).to.have.text(`${defaultStore[i + 1]} Remove`)
        );
      });
    });
  });
});
