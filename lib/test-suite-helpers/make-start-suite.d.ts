import { ITestDataObj } from 'suman-types/dts/it';
import { Suman } from '../suman';
export interface ITestSet {
    tests: Array<ITestDataObj>;
}
export declare const makeStartSuite: (suman: Suman, gracefulExit: Function, handleBeforesAndAfters: Function, notifyParentThatChildIsComplete: Function) => (finished: Function) => void;
