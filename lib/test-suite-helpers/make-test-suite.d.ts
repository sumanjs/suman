import { Suman } from '../suman';
export interface ISumanSymbols {
    [key: string]: symbol;
}
export declare const TestBlockSymbols: ISumanSymbols;
export declare const makeTestSuite: (suman: Suman, gracefulExit: Function, handleBeforesAndAfters: Function, notifyParent: Function) => any;
