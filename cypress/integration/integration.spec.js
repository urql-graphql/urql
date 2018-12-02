const defaultStore = ['test', 'test2', 'test3'];

context('Integration', () => {
  describe('on page load', () => {
    afterEach(() => {
      cy.wait(100);
    });

    it('executes/loads query', () => {
      cy.visit('/');
      cy.get('p').should('have.text', 'Loading...');
    });

    it('returns query data', () => {
      cy.visit('/');
      cy.get('ul > li').should('have.length', defaultStore.length);
      cy.get('ul > li').each((li, i) =>
        expect(li).to.have.text(`${defaultStore[i]} Remove`)
      );
    });
  });

  describe('on mutation', () => {
    it('updates list after deletion', () => {
      cy.visit('/');
      cy.get('ul > li')
        .first()
        .find('button')
        .click();

      cy.get('ul > li').should('have.length', defaultStore.length - 1);
      cy.get('ul > li').each((li, i) =>
        expect(li).to.have.text(`${defaultStore[i + 1]} Remove`)
      );
    });

    it('updates list after addition', () => {
      const newText = 'Hello Cypress!';

      cy.visit('/');
      cy.get('.form input').type(newText);
      cy.get('.form button').click();

      cy.get('ul > li').should('have.length', defaultStore.length);
      cy.get('ul > li')
        .last()
        .should('have.text', `${newText} Remove`);
    });
  });
});
