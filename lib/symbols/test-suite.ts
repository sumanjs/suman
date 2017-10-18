export interface ISumanSymbols {
  [key: string]: symbol
}

export const TestBlockSymbols = {

  bindExtras: Symbol('bindExtras'),
  getInjections: Symbol('bindExtras'),
  children: Symbol('children'),
  tests: Symbol('tests'),
  parallelTests: Symbol('parallelTests'),
  befores: Symbol('befores'),
  beforeEaches: Symbol('beforeEaches'),
  afters: Symbol('afters'),
  aftersLast: Symbol('aftersLast'),
  afterEaches: Symbol('afterEaches'),
  injections: Symbol('injections'),
  getAfterAllParentHooks: Symbol('getAfterAllParentHooks'),

} as ISumanSymbols;
