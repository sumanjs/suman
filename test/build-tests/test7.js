/**
 * Created by denman on 1/2/2016.
 */


var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.new('gggg', function () {

    this.before(function(){

        console.log('before 1');
    });

    this.beforeEach(function(){

        console.log('before');
    });


    this.describe('1',function(){

        this.it(function(){

            console.log('it-1')
        });

        this.it(function(){

            console.log('it-2')
        });

        this.it(function(){

            console.log('it-3')
        });


    });

    this.before(function(){
        console.log('before 2');
    });



});