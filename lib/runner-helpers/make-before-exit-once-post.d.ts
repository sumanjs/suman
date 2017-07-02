import { IRunnerObj } from "../../dts/runner";
import { IOncePost } from "../runner";
export declare const makeBeforeExit: (runnerObj: IRunnerObj, oncePosts: IOncePost, allOncePostKeys: string[][]) => (cb: Function) => any;
