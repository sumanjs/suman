export interface ISumanServerInfo {
    host: string;
    port: number;
}
export declare const findSumanServer: (serverName?: string) => ISumanServerInfo;
