import suman, {ITestCaseParam, IHookParam, IDescribeFn, IBeforeFn, ItFn} from 'suman';
const Test = suman.init(module);

Test.create(function (it: ItFn) {

  it('passes', (t: ITestCaseParam) => {

    t.skip();

  });

  it('fails', (t: ITestCaseParam) => {

    t.skip();

  });

});
