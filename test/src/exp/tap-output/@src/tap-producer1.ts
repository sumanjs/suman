import suman, {
  ITestCaseParam, IHookParam, IDescribeFn, IBeforeFn, ItFn,
  IBeforeEachFn, IAfterEachFn, IAfterFn
} from 'suman';

const Test = suman.init(module);

console.log('zoom');

Test.create(function (it: ItFn, before: IBeforeFn, describe: IDescribeFn,
                      beforeEach: IBeforeEachFn, afterEach: IAfterEachFn, after: IAfterFn) {

  before('yup', [(h: IHookParam) => {
    console.log('cocoa butter lol');
  }]);

  describe('ruby tuesday', function () {

  });

  it('zoom', (t: ITestCaseParam) => {

    // t.assert.deepEqual(false, true);
    // throw new Error('whole me 3');

  });

  it('rudolph', t => {
    // throw new Error('whole me 4');
  });

  afterEach('ram', (h: IHookParam) => {

  });

  after('b', (h: IHookParam) => {

    h.slow();

  });

});
