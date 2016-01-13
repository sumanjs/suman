/**
 * Created by denman on 1/2/2016.
 */

"use strict";

var debug = require('debug')('suman');
var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.describe('gggg', function () {


    this.before(() => {


    }).beforeEach(() => {

    });


    this.describe('1', function(){

        this.before(() => {

        });

        this.it('[test] yo', (t, done) => {

            setTimeout(function () {
                done();
            }, 1000);

        });

        this.it(t => {

        });

        this.it(t => {

        });


    });


    this.before(() => {

    });


});