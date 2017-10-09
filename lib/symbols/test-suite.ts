
export interface ISumanSymbols {
  [key: string]: Symbol
}

export default {

  describe: Symbol('bindExtras'),
  context: Symbol('context'),

} as ISumanSymbols;
