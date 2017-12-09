

import chai = require('chai');
import AssertStatic = Chai.AssertStatic;

export {ITestCaseParam, ITestSuite} from 'suman-types/dts/test-suite';
export {IHookParam} from 'suman-types/dts/test-suite';
export {ItFn, ITestDataObj} from 'suman-types/dts/it';
export {IDescribeFn, IDescribeOpts, TDescribeHook} from "suman-types/dts/describe";
export {IBeforeFn} from 'suman-types/dts/before';
export {IBeforeEachFn} from 'suman-types/dts/before-each';
export {IAfterFn} from 'suman-types/dts/after';
export {IAfterEachFn} from 'suman-types/dts/after-each';
export {DefineObject} from "./test-suite-helpers/define-options-classes";
export {DefineObjectContext as DefObjContext} from "./test-suite-helpers/define-options-classes";
export {DefineObjectTestCase as DefObjTestCase} from "./test-suite-helpers/define-options-classes";
export {DefineObjectAllHook as DefObjAllHook} from "./test-suite-helpers/define-options-classes";
export {DefineObjectEachHook as DefObjEachHook} from "./test-suite-helpers/define-options-classes";


// export namespace z {
//    export import x =s;
// }



// export {Z}

//
// export const s = {
//   DefineObjectContext,
//   DefineObjectTestCase,
//   DefineObjectAllHook,
//   DefineObjectEachHook,
//   IAfterEachFn
// };

// class FooTemp {}
// module FooTemp {}
// export { FooTemp as Foo }
// export namespace a {
//   export import Foo = FooTemp;
// }

// export namespace s {
//
//   // export class FooTemp {}
//
//   // export  {AfterEachFn} from 'suman-types/dts/after-each';
//
//   export const DefObjEachHook = DefineObjectEachHook;
//
//   // export const AfterFn = IAfterFn;
//
//   // export const AfterEachFn = IAfterEachFn
//
//   //
//   // export import DefObjTestCase = DefineObjectTestCase
//   //
//   //  export import DefObjContext = DefineObjectContext
//   //
//   // export import DefObjAllHook = X
//
// }
