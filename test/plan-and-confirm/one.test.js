const suman = require('suman');
const Test = suman.init(module);

Test.describe('SimpleTest', {parallel: true}, function (assert, fs, http, os) {


    //synchronous

    this.it(t => {

        t.plan(1);
        t.confirm();

    });

    this.before({fatal: false}, t=> {

        t.plan(3);
        t.confirm();

    });

    this.before({}, t=> {

        t.plan(3);
        t.confirm();

    });


    this.after(t=> {

        t.plan(1);
        t.confirm();

    });

    this.beforeEach({plan: 5}, t=> {

        t.plan(1);
        t.confirm();

    });

    this.afterEach(t=> {

        t.plan(1);
        t.confirm();

    });


});




