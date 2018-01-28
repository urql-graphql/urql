/* tslint:disable */

import * as exp from '../../components/context';

describe('Context', () => {
  it('should export a new react context', () => {
    expect(exp.Consumer).toBeTruthy();
    expect(exp.Provider).toBeTruthy();
  });
});
