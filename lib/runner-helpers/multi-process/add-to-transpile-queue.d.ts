import { ITableRows } from "suman-types/dts/runner";
import { IGanttHash } from "../socket-cp-hash";
export declare const makeAddToTranspileQueue: (f: string, transpileQueue: Object, tableRows: ITableRows, ganttHash: IGanttHash, projectRoot: string) => (fileShortAndFull: string[][]) => void;
