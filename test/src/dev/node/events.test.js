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
      ee.emit('done');
    }, 300);

    return ee;

  });

  it('test successEvents', {throws: /zoom/, errorEvents: ['bubba']}, t => {

    const ee = new EventEmitter();

    setTimeout(function () {
      ee.emit('bubba', new Error('zoom'));
    }, 300);

    return ee;

  });

  it('test successEvents', {throws: /zoom/, events: {error: ['bubba']}}, t => {

    const ee = new EventEmitter();

    setTimeout(function () {
      ee.emit('bubba', new Error('zoom'));
    }, 300);

    return ee;

  });

});
