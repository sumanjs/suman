/**
 * Created by amills001c on 11/30/15.
 */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');
var assert = require('assert');



Test.suite('suite 4', function (test) {

    var bob = 'big fascia';

    this.doggy = 'dooooggy';

    test.before(function (done) {

        assert.equal(test.doggy,'dooooggy');
        assert.equal(this.doggy,'dooooggy');

        console.log('ct:',this.currentTest);

        done();

    });

    test.before(function (done) {


        done();

    });

    test.beforeEach(function (done) {

        console.log(this.currentTest);

        assert.equal(test.doggy,'dooooggy');
        assert.equal(this.doggy,'dooooggy');

        done();

    });

    test.beforeEach(function (done) {

        assert.equal(test.doggy,'dooooggy');
        assert.equal(this.doggy,'dooooggy');
        done();

    });

    test.it('logs stuff 1', function () {

        assert.equal(test.doggy,'dooooggy');
        assert.equal(this.doggy,'dooooggy');

    });

    test.it('logs stuff 2', function () {


    });

    test.it('logs stuff 3', function (done) {


        done();
    });

    test.describe('darth', function (test) {

        var self = this;
        this.bob = 'small fascia';
        this.doggy = 'people';

        console.log('repub',test.doggy);

        test.before(function (done) {

            //assert.equal(this.parent.bob,'big fascia');
            //assert.equal(this,self);
            //assert.equal(bob,'big fascia');
            //assert.equal(this.bob,'small fascia');

            done();

        });

        test.it('sucks', function () {

            assert.equal(this.doggy,'people');


        });


    });

    test.before(function (done) {


        done();

    });

    test.beforeEach(function (done) {


        done();

    });

    test.after(function (done) {


        done();

    });

    test.afterEach(function (done) {


        done();

    });


});