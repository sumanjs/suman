

import Global = NodeJS.Global;

declare namespace SumanLib {
  const _suman: Object;
  const sumanConfig: Object;
  const sumanOpts: Object;
}


interface  GlobalSumanObj {
  _writeTestError: Function,
  sumanRuntimeErrors: Array<Error | string>,

}

interface ISumanOpts {
  ignoreUncaughtExceptions: boolean,
  useTAPOutput: boolean,
  vverbose: boolean

}

interface ISumanGlobalInternal {
  viaSuman?: boolean

}


interface ISumanGlobal extends Global {
  describeOnlyIsTriggered: boolean,
  sumanTestFile: string,
  userData: Object,
  iocConfiguration: Object,
  weAreDebugging: boolean,
  checkTestErrorLog:boolean,
  _writeLog: Function,
  _sumanIndirect: boolean,
  expectedExitCode: number,
  oncePreKeys: Array<string>,
  oncePostKeys: Array<string>,
  integProgressEmitter: EventEmitter,
  integContainer: Object,
  integProgressContainer: Object,
  iocEmitter: EventEmitter,
  iocContainer: Object,
  iocProgressContainer: Object,
  resultBroadcaster: EventEmitter,
  sumanReporters: Array<Object>,
  suiteResultEmitter: EventEmitter,
  integrantsEmitter: EventEmitter,
  _suman: ISumanGlobalInternal,
  _writeTestError: Function,
  sumanRuntimeErrors: Array<Error | string>,
  sumanOpts: ISumanOpts,
  sumanUncaughtExceptionTriggered: boolean,
  projectRoot: string,
  usingRunner: boolean,
  sumanInitCalled: boolean,
  sumanInitStartDate: number,
  _currentModule: string,
  SUMAN_TEST: string,
  sumanInitTime: number,
  expectedTimeout: number
}

declare var global: ISumanGlobal;


interface SumanErrorRace extends Error {
  _alreadyHandledBySuman: boolean

}
