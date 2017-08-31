
import suman, {
  ITestCaseParam, IHookParam, IDescribeFn, IBeforeFn, ItFn, IBeforeEachFn,
  IAfterEachFn, IAfterFn
} from 'suman';

const Test = suman.init(module);


Test.create(function (it: ItFn, before: IBeforeFn, describe: IDescribeFn,
                      beforeEach: IBeforeEachFn, afterEach: IAfterEachFn, after: IAfterFn) {

  before('yup', [(h: IHookParam) => {



  }]);

  describe('ruby tuesday', function () {

  });

  it('zoom', (t: ITestCaseParam) => {

    t.assert.deepEqual(false, true);

  })
  .it('fails', suman.autoPass)
  .afterEach('ram', (h: IHookParam) => {

  });

  after('b', (h: IHookParam) => {

    h.slow();

  });

});
