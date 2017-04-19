import Global = NodeJS.Global;
import Domain = NodeJS.Domain;

declare namespace SumanLib {
  const _suman: Object;
  const sumanConfig: Object;
  const sumanOpts: Object;
}


interface  IGlobalSumanObj {
  sumanHelperDirRoot: string,
  _writeTestError: Function,
  sumanRuntimeErrors: Array<Error | string>,
  sumanOpts: ISumanOpts,
  suiteResultEmitter: EventEmitter,
  maxMem: IMaxMem,
  sumanConfig: ISumanConfig,
  describeOnlyIsTriggered: boolean,
  sumanTestFile: string,
  userData: Object,
  iocConfiguration: Object,
  weAreDebugging: boolean,
  checkTestErrorLog: boolean,
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
  integrantsEmitter: EventEmitter,
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

interface IMaxMem {
  heapTotal: number,
  heapUsed: number
}

interface ISumanOpts {
  ignoreUncaughtExceptions: boolean,
  useTAPOutput: boolean,
  verbosity: number,
  check_memory_usage: boolean

}

interface ISumanGlobalInternal {
  viaSuman?: boolean

}


interface ISumanGlobal extends Global {
  _suman: IGlobalSumanObj
}


interface SumanErrorRace extends Error {
  _alreadyHandledBySuman: boolean

}


interface IPsuedoError {
  stack?: string
  message?: string,
  sumanFatal?: boolean,
  sumanExitCode?: number
}


interface ISumanDomain extends Domain {
  _sumanStartWholeShebang: boolean
  exit: Function
}

declare enum BrowserTypes {
  Firefox,
  Chrome,
}


interface ISumanConfig {

  matchAny: Array<RegExp>,
  matchNone: Array<RegExp>,
  matchAll: Array<RegExp>,

  // Object: child process logging
  childProcessLogs: Array<number>,

  //string
  testDir: string,
  testSrcDir: string,
  testTargetDir: string,
  sumanHelpersDir: string,
  uniqueAppName: string,
  browser: BrowserTypes,

  //boolean
  includeSumanGlobalsInPath: boolean,
  useSumanUtilityPatches: boolean,
  useTAPOutput: boolean,
  errorsOnly: boolean,
  replayErrorsAtRunnerEnd: boolean,
  logStdoutToTestLogs: boolean,
  allowArrowFunctionsForTestBlocks: boolean,
  alwaysUseRunner: boolean,
  enforceGlobalInstallationOnly: boolean,
  enforceLocalInstallationOnly: boolean,
  sourceTopLevelDepsInPackageDotJSON: boolean,
  enforceTestCaseNames: boolean,
  enforceBlockNames: boolean,
  enforceHookNames: boolean,
  bail: boolean,
  bailRunner: boolean,
  useBabelRegister: boolean,
  transpile: boolean,
  executeRunnerCWDAtTestFile: boolean,
  sendStderrToSumanErrLogOnly: boolean,
  useSuiteNameInTestCaseOutput: boolean,
  ultraSafe: boolean,
  verbose: boolean,
  checkMemoryUsage: boolean,
  fullStackTraces: boolean,
  disableAutoOpen: boolean,
  suppressRunnerOutput: boolean,
  allowCollectUsageStats: boolean,

  //integers
  saveLogsForThisManyPastRuns: number,
  verbosity: number,
  maxParallelProcesses: number,
  resultsCapCount: number,
  resultsCapSize: number,

  //integers in millis
  defaultHookTimeout: number,
  defaultTestCaseTimeout: number,
  timeoutToSearchForAvailServer: number,
  defaultDelayFunctionTimeout: number,
  defaultChildProcessTimeout: number,
  defaultTestSuiteTimeout: number,
  expireResultsAfter: number,


}
