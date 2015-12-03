/**
 * Created by amills001c on 12/3/15.
 */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');



Test.suite('My Suite', function(suite){


    this.describe('bugs',function(){

        this.it('is meow',function(){

            console.log('is good');
        });

        this.describe('turtles',function(){


            this.it('is chao',function(){

                console.log('is good');
            });


            this.describe('sounds',function(){


                this.it('is good',function(){

                    console.log('is good');
                });


            });

        });

    });









});