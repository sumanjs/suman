import { ISumanConfig, ISumanOpts } from "../../dts/global";
export declare const vetLocalInstallations: (sumanConfig: ISumanConfig, opts: ISumanOpts, projectRoot: string) => {
    sumanServerInstalled: boolean;
    sumanInstalledLocally: boolean;
    sumanInstalledAtAll: boolean;
};
