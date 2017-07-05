import { ISumanChildProcess } from "../../dts/runner";
export interface ICpHash {
    [key: string]: ISumanChildProcess;
}
export interface ISocketHash {
    [key: string]: SocketIOClient.Socket;
}
export declare const cpHash: ICpHash;
export declare const socketHash: ISocketHash;
