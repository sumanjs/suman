/**
 * Created by denman on 2/9/16.
 */


import * as suman from '../../lib';
var Test = suman.init(module);

////////

Test.describe('B2', {}, function (socketio, request, assert, choodles, fs) {


    var paper = [];

    setTimeout(() => {
        paper.push('1');
        paper.push('2');
        paper.push('3');
        this.resume();
    }, 1000);


    this.it('oodles', function(){
        assert(paper[0] === '1');

    });

    this.it('oodles', function(){
        assert(paper[2] === '3');
    });



});