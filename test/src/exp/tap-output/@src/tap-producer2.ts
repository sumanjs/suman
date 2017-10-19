import suman, {ITestCaseParam, IHookParam, IDescribeFn, IBeforeFn, ItFn} from 'suman';
const Test = suman.init(module);

Test.create(function (it: ItFn) {

  it('passes', (t: ITestCaseParam) => {

    // t.skip();
    throw new Error('whole me 1')

  });

  it.cb('fails', (t: ITestCaseParam) => {

    // t.skip();
    throw new Error('whole me 2')

    setTimeout(function () {
      t.done();
    }, 1000);

  });

});
