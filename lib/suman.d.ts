/// <reference types="node" />
import { ISumanConfig } from "../dts/global";
export interface ITableDataCallbackObj {
    exitCode: number;
    tableData: Object;
}
export default function _makeSuman($module: NodeModule, _interface: string, shouldCreateResultsDir: boolean, config: ISumanConfig, cb: Function): void;
