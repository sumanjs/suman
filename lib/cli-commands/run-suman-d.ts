import {startSumanShell, ISubsetSumanDOptions} from 'suman-shell';

export const run = function (projectRoot: string, sumanLibRoot: string, opts: ISubsetSumanDOptions) {

  const fn = startSumanShell(projectRoot, sumanLibRoot, opts || {});

  // call clean up fn when process exits
  process.once('exit', fn);

};
