import { IPseudoError } from "../../dts/global";
export interface ICloneErrorFn {
    (err: Error, newMessage: string, stripAllButTestFilePathMatch?: boolean): IPseudoError;
}
export declare const cloneError: ICloneErrorFn;
