/**
 * Created by amills001c on 3/20/16.
 */

var assert = require("assert"),
    fs = require('fs');


describe('a',function(){

    (this.parent);

    this.title.X;
    this.file.X;
    this.parent.title;  //this.parent is null

    describe('b',function(){

        (this.parent);
        this.title.X;             // ''
        this.file.X;              // ''
        this.parent.title;        // ''

        before(function(){

            //this.currentTest;   //  currentTest is not defined for before hooks
            //this.test.parent.title;  //  this.title;  (this.test.parent = this)

        });

        beforeEach(function(){

            (this.currentTest.parent.title);   // this.title
            (this.currentTest);    // this.currentTest = t
            (this.test.parent);    // this.test.parent = this
        });

        it('a', function(){

            (this.test.title);          // t.title
            (this.test.parent.title);   // this.title

        });

        it('a', function(){

            (this.test.title);               // t.title
            (this.test.parent.title);        // this.title

        });


        afterEach(function(){

            (this.currentTest.title) ;          // t.title
            (this.currentTest.parent.title);   // this.title
            (this.test.parent);                // this
        });


        after(function(){

            (this.title);

        });

    });

});