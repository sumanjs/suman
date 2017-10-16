#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////

Test.create(function (assert, describe, before, beforeEach, after, afterEach, it, $core, events) {

  const EventEmitter = events.EventEmitter;

  it('test successEvents', {successEvents: null}, t => {

    const ee = new EventEmitter();

    setTimeout(function () {
      console.log('emitting done');
      ee.emit('done');
    }, 300);

    return ee;

  });

  it('test successEvents', {errorEvents: ['bubba']}, t => {

    const ee = new EventEmitter();

    setTimeout(function () {
      console.log('emitting bubba error');
      ee.emit('bubba',new Error('zoom'));
    }, 300);

    return ee;

  });

});
