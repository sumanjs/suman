#!/usr/bin/env node
'use strict';

import * as suman from 'suman';
import {IBeforeHook} from 'suman';

// rock in roll
const Test = suman.init(module, {
  ioc: {
    b: 'far',
    a: 'foo',
    c: 'charge'
  },
  pre: ['three', 'two']
});


Test.create(function (assert, before, beforeEach, it, after, afterEach) {


  before((h: IBeforeHook) => {


  });

  console.log('yolo');

  it('is great', t => {

  });

  it('is great', t => {

    throw new Error('fml');
  });


});

