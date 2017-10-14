import * as suman from 'suman';
const Test = suman.init(module);

Test.create('example', (baz, http, beforeEach, context, inject, foo, x, beforeAll) => {

  // Suman uses simple old-school style JavaScript DI
  // we have injected some core modules by name (http, assert, path)
  // we have also injected a module from our own project, baz

  inject('bar', () => {
    return baz(foo).then(v => {
      return v.filter(val => val.isGreen())
    })
  })

  beforeAll(h => {
    return x.anything().then(function(v){
      h.assert(typeof v === 'boolean');
      h.$inject.v = v;
    });
  });


  beforeEach(t => {
    t.data.v = (t.value.v * 2) + t.$inject.v;
  })

  context('foo', {mode: 'series'}, (bar, it) => {

    it('a', {value: 5}, t => {
      t.assert.equal(t.title,'a')
      t.assert.equal(t.data.v,10)
    })

    it('b', t => {
      t.assert.equal(t.title, 'b')
    })

    it('c', t => {
      t.assert.equal(t.title, 'c')
    })

    context('nested child', {mode: 'parallel'}, (bar, it) => {

      it('a', t => {
        t.assert.equal(t.title, 'a')
      })

      it('b', t => {
        t.assert.equal(t.title, 'b')
      })

      it('c', t => {
        t.assert.equal(t.title, 'c')
      })

    })

  })

})
