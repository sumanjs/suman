/**
 * Created by amills001c on 4/13/16.
 */


const suman = require('../../lib');
const Test = suman.init(module);


Test.describe('SimpleTest', function (assert, fs, http, os) {


    this.it('tests-arrays', function () {
        assert.equal(typeof [], 'object');
    });


    ['describe', 'it', 'before', 'after', 'afterEach'].forEach(item => {

        this.it('tests-suman suite block for: ' + item, function () {
            assert(this.hasOwnProperty(item));
        });

    });

    this.it.only('Check that Test.file is equiv. to module.filename', {timeout:1970},  done => {
        setTimeout(function(){
            assert(module.filename === Test.file);
            done();
        },1999);
    });


    this.it('reads this file, pipes to /dev/null', function (fail, pass) {

        const destFile = os.hostname === 'win32' ? process.env.USERPROFILE + '/temp' : '/dev/null';

        fs.createReadStream(Test.file).pipe(fs.createWriteStream(destFile))
            .on('error', fail).on('finish', pass);

    });


    this.it('uses promises to handle http', {timeout: 4000}, function () {

        return new Promise(function (resolve, reject) {

            const req = http.request({

                method: 'GET',
                hostname: 'example.com'

            }, res => {

                var data = '';

                res.on('data', function (d) {
                    data += d;
                });

                res.on('end', function () {

                    assert(typeof data === 'string');
                    resolve();

                });

            });

            req.end();
            req.on('error', reject);
        });

    });
    
});



