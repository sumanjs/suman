/// <reference types="node" />
import { ISumanConfig } from "../dts/global";
export interface ITableDataCallbackObj {
    exitCode: number;
    tableData: Object;
}
export declare const makeSuman: ($module: NodeModule, _interface: string, shouldCreateResultsDir: boolean, config: ISumanConfig, cb: Function) => void;
