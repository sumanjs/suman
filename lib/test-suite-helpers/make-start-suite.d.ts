import { ISuman } from "suman-types/dts/suman";
export declare const makeStartSuite: (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function, notifyParentThatChildIsComplete: Function) => (finished: Function) => void;
