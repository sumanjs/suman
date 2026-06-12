#!/usr/bin/env node


'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var suman = require('suman');
var Test = suman.init(module, {});

Test.create('root suite description', {}, function () {
  // we define the root suite

  //note: we are in the context of the "root suite"

  var self = this; // (avoid the self pattern in Suman tests, here for explanation only :)

  this.before('aeageo', (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    var bnans;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return new _promise2.default(function (resolve) {
              resolve('bananas');
            });

          case 2:
            bnans = _context.sent;

            console.log('bananas:', bnans);
            console.log('1', this === self); //true

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  })));

  this.it('grjp', function () {
    console.log('yes');
  });

  this.it('peaglg', function () {
    console.log('yes');
  });

  this.it('ageage', function () {
    console.log('yes');
  });
});
