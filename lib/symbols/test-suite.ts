
export interface ISumanSymbols {
  [key: string]: Symbol
}

export default {

  bindExtras: Symbol('bindExtras'),
  getInjections: Symbol('bindExtras'),


} as ISumanSymbols;
