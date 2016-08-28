/**
 * Created by Olegzandr on 5/14/16.
 */


//in the gulp repo that had this:


////////////////////////////////////////////

var rimraf = require('rimraf');


beforeEach(rimraf.bind(null, outpath));
afterEach(rimraf.bind(null, outpath));

// since suman hooks only take a singular param, t, and t is not a function
//the above needs to be manually refactored to:

this.beforeEach.cb(t => {
    rimraf.call(null, outpath, t.done);
});

this.beforeEach.cb(t => {
    mkdirp.call(null, outpath, t.done);
});

this.afterEach.cb(t => {
    rimraf.call(null, outpath, t.done);
});

///////////////////////////////////////////


this.describe('with canonicalized mime types', function () {
    test.bind(this)(app1);
})


function test(app) {

    this.it.cb('should utilize qvalues in negotiation', t => {
        var done = t.done;
        request(app)
            .get('/')
            .set('Accept', 'text/html; q=.5, application/json, */*; q=.1')
            .expect({"message": "hey"}, done);
    })

///////////////////////////////////