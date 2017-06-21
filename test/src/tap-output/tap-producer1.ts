import suman, {ITestCaseParam, IHookParam, IDescribeFn, IBeforeFn} from 'suman';
import {ItFn} from "../../../dts/it";

const Test = suman.init(module);

Test.create(function (it: ItFn, before: IBeforeFn, describe: IDescribeFn) {

  before([(h: IHookParam) => {


  }]);

  describe('ruby tuesday',function(){


  });


  it('zoom',(t: ITestCaseParam) => {


  });


  it('fails', suman.autoPass);

});
