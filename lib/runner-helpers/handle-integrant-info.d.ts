import { IRunnerObj, ISumanChildProcess } from "../../dts/runner";
import { IIntegrantHash } from "../runner";
export declare const makeHandleIntegrantInfo: (runnerObj: IRunnerObj, allOncePostKeys: string[][], integrantHashKeyVals: IIntegrantHash) => (msg: Object, n: ISumanChildProcess, s: SocketIOClient.Socket) => any;
