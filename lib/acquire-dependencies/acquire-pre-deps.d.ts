import { IDepContainer } from "../../dts/integrant-value-container";
export interface IOncePostHash {
    [key: string]: any;
}
export declare const acquireDependencies: ($depList: string[] | string[][], depContainerObj: IDepContainer, oncePostHash: IOncePostHash) => Promise<any>;
