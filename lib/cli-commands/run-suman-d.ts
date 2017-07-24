import {startSumanD, ISubsetSumanDOptions} from 'suman-d';

export const run = function (projectRoot: string, sumanLibRoot: string, opts: ISubsetSumanDOptions) {

  const fn = startSumanD(projectRoot, sumanLibRoot, opts || {});

};
