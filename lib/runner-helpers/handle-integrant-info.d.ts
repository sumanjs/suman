/// <reference types="socket.io-client" />
import { IRunnerObj, ISumanChildProcess } from "suman-types/dts/runner";
export declare const makeHandleIntegrantInfo: (runnerObj: IRunnerObj, allOncePostKeys: any, integrantHashKeyVals: any) => (msg: Object, n: ISumanChildProcess, s: SocketIOClient.Socket) => any;
