/**
 * Created by denman on 2/9/16.
 */


import * as suman from '../../lib';
var Test = suman.init(module);

//mcgee1

Test.describe('B2', {}, function (socketio, request, delay, assert, choodles, fs) {


    var paper = [];

    setTimeout(function(){
        paper.push('1');
        paper.push('2');
        paper.push('3');
        delay();
    }, 1000);



    this.it('oodles', function(){
        assert(paper[0] === '1');

    });

    this.it('oodles', function(){
        assert(paper[2] === '3');
    });



});