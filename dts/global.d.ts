import Global = NodeJS.Global;
import Domain = NodeJS.Domain;
import {ITestSuite} from "./test-suite";
import EventEmitter = NodeJS.EventEmitter;
import {ISuman} from "./suman";
import {IMapValue} from "suman-utils";
import {ITableDataCallbackObj} from "../lib/suman";


export interface IntegrantHashKeyVals {
  [key: string]: any
}

export interface IGlobalSumanObj {
  // we should execute Suman's in series, that makes it easier to run after.always shutdown, etc
  // which suman represents which Suman is executing at a given time

  endLogStream: Function,
  tableResults: Array<ITableDataCallbackObj>,
  startDateMillis: number,
  socketServerPort: number,
  $forceInheritStdio: boolean,
  markersMap: IMapValue,
  integrantHashKeyVals: IntegrantHashKeyVals,
  usingDefaultConfig: boolean,
  istanbulExecPath: string,
  multiWatchReady: boolean,
  sumanSingleProcessStartTime: number,
  processIsRunner?: boolean;
  dateEverythingStarted: number;
  runId: number,
  isStrmDrained: boolean,
  drainCallback: Function,
  inceptionLevel?: number,
  whichSuman: ISuman,
  logInfo: Function,
  logWarning: Function,
  logError: Function,
  log: Function,
  $pre: Object,
  afterAlwaysEngaged: boolean,
  timestamp: Number,
  inBrowser: boolean,
  ctx: ITestSuite,
  viaSuman: boolean,
  sumanHelperDirRoot: string,
  writeTestError: Function,
  sumanRuntimeErrors: Array<Error | string>,
  sumanOpts: ISumanOpts,
  suiteResultEmitter: EventEmitter,
  maxMem: IMaxMem,
  sumanConfig: ISumanConfig,
  describeOnlyIsTriggered: boolean,
  sumanTestFile: string,
  userData: Object,
  useSumanD: boolean,
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
  sumanUncaughtExceptionTriggered: Object,
  projectRoot: string,
  usingRunner: boolean,
  sumanInitCalled: boolean,
  sumanInitStartDate: number,
  _currentModule: string,
  SUMAN_TEST: string,
  sumanInitTime: number,
  expectedTimeout: number
}

export interface IMaxMem {
  heapTotal: number,
  heapUsed: number
}

export interface ISumanOpts {
  transpile: boolean,
  bail: boolean,

  ///// above this line may need fixin'

  log_stdio_to_files: boolean,
  log_stdout_to_files: boolean,
  log_stderr_to_files: boolean,
  cwd_is_root: boolean,
  full_stack_traces: boolean,
  runner: boolean,
  coverage: boolean,
  watch_per: string,
  watch: boolean,
  no_transpile: boolean,
  no_run: boolean,
  no_color: boolean,
  register: boolean,
  rand: boolean,
  no_tables: boolean,
  force: boolean,
  fforce: boolean,
  reporters: string,
  reporter_paths: Array<string>
  strict: boolean,
  suman_helpers_dir: boolean,
  init: boolean,
  ignoreUncaughtExceptions: boolean,
  useTAPOutput: boolean,
  verbosity: number,
  check_memory_usage: boolean
  errors_only: boolean
}

export interface ISumanGlobalInternal {
  viaSuman?: boolean

}

export interface ISumanGlobal extends Global {
  __suman?: IGlobalSumanObj
}

export interface SumanErrorRace extends Error {
  _alreadyHandledBySuman?: boolean
}

export interface IPseudoError {
  stack?: string
  message?: string,
  sumanFatal?: boolean,
  sumanExitCode?: number
}

export interface ISumanDomain extends Domain {
  _sumanStartWholeShebang?: boolean
}

export declare enum BrowserTypes {
  Firefox,
  Chrome,
}

export interface ISumanConfWatchPerItem {
  exec: string,
  confOverride: Partial<ISumanConfig>,
  include: Array<string | RegExp>,
  exclude: Array<string | RegExp>
}

export interface ISumanConfWatchPer {
  [key: string]: ISumanConfWatchPerItem
}

export interface ISumanConfigWatch {
  per: ISumanConfWatchPer
}

export interface ISumanConfig {

  [key: string]: any,

  DEFAULT_PARALLEL_TOTAL_LIMIT: number,
  DEFAULT_PARALLEL_BLOCK_LIMIT: number,
  DEFAULT_PARALLEL_TEST_LIMIT: number,

  matchAny: Array<RegExp | string>,
  matchNone: Array<RegExp | string>,
  matchAll: Array<RegExp | string>,

  //string
  testDir: string,
  testSrcDir: string,
  testTargetDir: string,
  sumanHelpersDir: string,
  uniqueAppName: string,
  browser: BrowserTypes,

  //boolean
  useSumanWatch: boolean,
  installSumanExtraDeps: boolean,
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

  watch: ISumanConfigWatch

}
