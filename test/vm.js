const suman = require('suman');//
const test = suman.init(module);

let val = 1;

test.create(String(val++), function (it, beforeEach, assert) {

  this.describe.only('inner', function () {

    this.it('makes good 1', t => {
      t.assert(true, 'fudge.');
      t.assert.equal(true, true, 'damn');
    });

    this.it.only('makes good 2', t => {
      t.assert(true, 'fudge.');
      t.assert.equal(true, true, 'damn');
    });

  });

});

