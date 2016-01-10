/**
 * Created by denman on 1/2/2016.
 */

"use strict";

var debug = require('debug')('suman:test');
var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.describe('gggg', function () {


    this.before(() => {

        debug('before 1');

    }).beforeEach(() => {

        debug('beforeEach');


    }).describe('1', () => {

        this.it('[test] yo', (t, done) => {

            setTimeout(function () {
                debug(t);
                done();
            }, 1000);

        });

        this.it(t => {

            debug('it-2')
        });

        this.it(t => {

            debug('it-3')
        });


    });


    this.before(() => {
        debug('before 2');
    });


});