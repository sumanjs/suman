#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////

Test.create(function (b, assert, describe, before, beforeEach, after, afterEach, it, $core, events) {

  const EE = events.EventEmitter;


  it('test successEvents', {successEvents: null}, t => {

    const ee = new EE();

    setTimeout(function () {
      ee.emit('done');
    }, 30);

    return ee;

  });

  it('test successEvents', {throws: /zoom/, errorEvents: ['bubba']}, t => {

    const ee = new EE();

    setTimeout(function () {
      ee.emit('bubba', new Error('zoom'));
    }, 30);

    return ee;
  });

  it('test successEvents', {throws: /zoom/, events: {error: ['bubba']}}, t => {

    const ee = new EE();

    setTimeout(function () {
      ee.emit('bubba', new Error('zoom'));
    }, 30);

    return ee;

  });

});
