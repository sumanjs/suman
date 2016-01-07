/**
 * Created by denman on 1/2/2016.
 */

var debug = require('debug')('suman:test');
var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.new('gggg', function () {

    this.before(function(){

        debug('before 1');
    });

    this.beforeEach(function(){

        debug('before');
    });


    this.describe('1',function(){

        this.it(function(){

            debug('it-1')
        });

        this.it(function(){

            debug('it-2')
        });

        this.it(function(){

            debug('it-3')
        });


    });

    this.before(function(){
        debug('before 2');
    });



});