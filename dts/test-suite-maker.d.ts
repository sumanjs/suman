

type TTestSuiteMaker = (data: any) => ITestSuite;

interface ITestSuiteMakerOpts {
    desc: string,
    title: string,
    opts: Object
}

