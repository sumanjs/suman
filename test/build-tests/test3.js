/**
 * Created by amills001c on 12/3/15.
 */


var suman = require('../../index.js');
var Test = suman.new(module, 'suman.conf.js');


Test.suite('My Suite', function (suite) {


    this.describe('bugs', function () {

        this.it('is meow', function () {


        });

        this.describe('turtles', function () {


            this.it('is chao', function () {


            });


            this.describe('sounds', function () {


                this.it('is good', function () {


                });


            });

        });

    });


});