const defaultStore = ['test', 'test2', 'test3'];

context('Integration', () => {
  describe('on page load', () => {
    it('shows no results', () => {
      cy.visit('/');
      cy.get('p').should('have.text', 'No new messages');
    });
  });

  describe('on page idle', () => {
    before(() => {
      cy.visit('/');
    });

    it('receives a new message within 6 seconds', () => {
      cy.wait(6000);
      cy.get('li').should('exist');
    });

    it('displays message sender', () => {
      cy.get('li h4').should('not.be.empty');
    });

    it('displays message text', () => {
      cy.get('li p').should('not.be.empty');
    });

    it('receives at least two messages within 15 seconds', () => {
      cy.wait(9000);
      cy.get('li').should('have.length.greaterThan', 2);
    });
  });
});
