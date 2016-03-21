'use strict';

/**
 * Created by amills001c on 3/20/16.
 */

var assert = require("assert"),
    fs = require('fs');

var suman = require('suman');

var Test = suman.init(module);

Test.describe('a', function (assert, fs) {

    this.describe('b', function () {

        this.it('a', function (t, done) {});

        this.it('a', function (t) {});
    });
});