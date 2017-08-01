import { IDepContainer } from "../../dts/integrant-value-container";
export interface IOncePostHash {
    [key: string]: any;
}
export declare const acquirePostDeps: ($depList: string[] | string[][], depContainerObj: IDepContainer) => Promise<any>;
