/* globals suman */

import {s} from 'suman';
let {Test} = suman.init(module);

Test.create(function (it: s.ItFn, context: s.IDescribeFn) {

  it('passes with flying colors', t => {


  });

  context('is good', b => {


    b.set('good', true);

    it('is good 1', t => {
      t.assert.equal(t.get('good'), true);
    });

    it('is good 2', t => {
      t.assert.equal(t.get('good'), true);
    });

  });


  context('is good', b => {


    b.set('good', true);
    it.skip('is good');

  });


  context('is good', b => {


    b.set('good', true);
    it.skip('is good');


    context('is good', b => {


      b.set('good', false);

      it('is very good', t => {
        t.assert.equal(t.get('good'), false);
      });

      it('is very good', t => {
        t.assert.equal(t.get('good'), false);
      });

    });

  });

  context('is good', b => {


    b.set('good', true);
    it.skip('is good');

  });

});
