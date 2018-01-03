/**
 * Created by denman on 3/26/2016.
 */

const suman = require('suman');
const Test = suman.init(module, {
  interface: 'BDD'   //BDD interface is default but we are explicit
});

// here we create the test suite, we can pass in core modules, and any value defined in suman.ioc.js
Test.create('#Test1', function (assert, fs, http, path, describe, it, beforeEach) {

  describe('tests multiplication', function () {

    beforeEach(t => {   //this runs before any test case inside this describe block
      t.data.foo = 3;
    });

    it('[test] 1', async (t) => {  // t represents this test case, t.data properties can be set prior in hooks

      const bar = await new Promise(function (resolve) {
        resolve('7');
      });
      const baz = bar * t.data.foo;
      assert.equal(baz, 21);

    });

  });

  describe('tests streams', function () {

    beforeEach(t => {  //this runs before any test case inside this describe block
      t.data.srcDir = path.resolve(process.env.HOME + '/test_data');
    });

    //fail and pass are analagous to done('err') and done(null) respectively
    it('[test] 2', t => {

      fs.createReadStream(t.data.srcDir)
      .pipe(fs.createWriteStream('/dev/null')).on('error', t.fail).on('finish', t.pass);

    });

  });

  describe('tests http request', function () {

    ['/foo', '/bar', '/bar'].forEach(val => {

      it('[test] 3', t => {

        return http.get({
          hostname: 'example.com',
          path: val,
          headers: {
            'Accept': 'text/plain',
            'Content-Type': 'application/json'
          }
        }, res => {

          res.setEncoding('utf8');

          var body = '';

          res.on('data', (data) => {
            body += data;
          });

          res.on('end', () => {
            const result = JSON.parse(body);
            assert(result.x = 'y');
            t.done();
          });

        });

      });

    });

  });

});
