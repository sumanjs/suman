/**
 * Created by denman on 12/3/15.
 */


const suman = require('suman');
const Test = suman.init(module, {

});


Test.describe('My Suite', {}, function () {


    this.describe('bugs', function () {


        this.it.only('is meow', function (t) {

            //throw new Error('jesus christ');
            //setTimeout(function(){
            //    throw new Error('jesus');
            //    done();
            //},10);

        });

        this.describe('turtles', {}, function () {

            this.beforeEach(function () {

                //throw new Error('michal');

            });


            this.describe('sounds', function () {

                this.it.cb('is good');


            });

        });

    });


});


