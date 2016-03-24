/**
 * Created by amills001c on 3/20/16.
 */

var assert = require("assert"),
    fs = require('fs');


describe('a',function(){

    console.log(this.parent);

    this.title.X;
    this.file.X;
    this.parent.title;  //this.parent is null

    describe('b',function(){

        console.log(this.parent);
        this.title.X;             // ''
        this.file.X;              // ''
        this.parent.title;        // ''

        before(function(){

            this.currentTest;   //  currentTest is not defined for before hooks
            this.test.parent.title;  //  this.title;  (this.test.parent = this)

        });

        beforeEach(function(){

            console.log(this.currentTest.parent.title);   // this.title
            console.log(this.currentTest);    // this.currentTest = t
            console.log(this.test.parent);    // this.test.parent = this
        });

        it('a', function(){

            console.log(this.test.title);          // t.title
            console.log(this.test.parent.title);   // this.title

        });

        it('a', function(){

            console.log(this.test.title);               // t.title
            console.log(this.test.parent.title);        // this.title

        });


        afterEach(function(){

            console.log(this.currentTest.title) ;          // t.title
            console.log(this.currentTest.parent.title);   // this.title
            console.log(this.test.parent);                // this
        });


        after(function(){

            console.log(this.title);

        });

    });

});