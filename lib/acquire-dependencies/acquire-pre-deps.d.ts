export interface IOncePostHash {
    [key: string]: any;
}
export declare const acquirePreDeps: ($depList: string[] | string[][], depContainerObj: any, oncePostHash: IOncePostHash) => Promise<any>;
