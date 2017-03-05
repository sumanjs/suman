interface Suman {
    numHooksSkipped: number,
    numHooksStubbed: number

}


type TestSuiteGetterFn <T> = () => Array<T>;


interface AfterObj {
    ctx: TestSuite,
    timeout: number,
    desc: string,
    cb: boolean,
    throws: RegExp,
    planCountExpected: number,
    fatal: boolean,
    fn: Function,
    type: string,
    warningErr: Error
}


interface TestSuite {

    opts: Object,
    testId: number,
    isSetupComplete: boolean,
    parallel: boolean,
    skipped: boolean,
    only: boolean,
    filename: string,
    fileName: string
    injectedValues: Object,
    getInjections: Function,
    getChildren: Function,
    getTests: TestSuiteGetterFn<any>,
    getParallelTests: TestSuiteGetterFn<any>,
    getTestsParallel: TestSuiteGetterFn<any>,
    getLoopTests: TestSuiteGetterFn<any>,
    getBefores: TestSuiteGetterFn<any>,
    getBeforeEaches: TestSuiteGetterFn<any>,
    getAfters: TestSuiteGetterFn<AfterObj>,
    getAfterEaches: TestSuiteGetterFn<any>

}
