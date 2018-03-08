#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

Test.create(function (before, beforeEach, afterEach, it, after) {

  before(h => {
    h.supply.three = 3;
    h.assert.equal(h.supply.three, 3);
  });

  beforeEach(h => {
    h.assert.equal(h.supply.three, 3);
  });

  it('testo', t => {
    t.plan(2);
    t.confirm();
    t.assert.equal(t.supply.three, 3);
  });

  afterEach(h => {
    h.assert.equal(h.supply.three, 3);
  });

  after(h => {
    h.assert.equal(h.supply.three, 3);
  });

});

