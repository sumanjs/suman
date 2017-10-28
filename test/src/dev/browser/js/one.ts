/* globals suman */

declare const module;
import {ItFn, IDescribeFn} from 'suman';
let {Test} = suman.init(module);

Test.create(function (it: ItFn, context: IDescribeFn) {

  it('passes with flying colors', t => {


  });

  context('is good', b => {


    b.set('good', true);
    it('is good');

  });


  context('is good', b => {


    b.set('good', true);
    it.skip('is good');

  });

});
