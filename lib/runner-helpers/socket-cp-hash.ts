'use strict';
import {ISumanChildProcess} from "../../dts/runner";


export interface ICpHash {
  [key:string]: ISumanChildProcess
}

export interface ISocketHash {
  [key:string]: SocketIOClient.Socket
}

export interface IGanttData{
  fullFilePath: string;
  shortFilePath: string;
  filePathFromProjectRoot: string;
  transformStartDate: number;
  transformEndDate: number;
  startDate: number;
  endDate: number;
}

export interface IGanttHash {
  // key is uuid
  [key:string]: IGanttData
}

export const cpHash : ICpHash = {};
export const socketHash: ISocketHash = {};
export const ganttHash: IGanttHash = {};
