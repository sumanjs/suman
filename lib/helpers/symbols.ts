
export interface ISumanSymbols {
  [key: string]: Symbol
}

export default {

  describe: Symbol('describe'),
  context: Symbol('context'),
  suite: Symbol('suite'),
  it: Symbol('it'),
  test: Symbol('test'),
  setup: Symbol('setup'),
  setuptest: Symbol('setuptest'),
  teardown: Symbol('teardown'),
  teardowntest: Symbol('teardowntest'),
  beforeeach: Symbol('beforeeach'),
  aftereach: Symbol('aftereach'),
  before: Symbol('before'),
  beforeall: Symbol('beforeall'),
  after: Symbol('after'),
  afterall: Symbol('afterall'),

} as ISumanSymbols;
