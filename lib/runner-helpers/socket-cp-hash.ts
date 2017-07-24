'use strict';
import {ISumanChildProcess} from "../../dts/runner";


export interface ICpHash {
  [key:string]: ISumanChildProcess
}

export interface ISocketHash {
  [key:string]: SocketIOClient.Socket
}

export const cpHash : ICpHash = {};
export const socketHash: ISocketHash = {};
