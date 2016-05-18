
### :: Installation ::

1. => <span style="background-color:#FF8C00">&nbsp;```$ npm install -g suman```</span>

2. => cd into the project where you want to use Suman to power your tests

3. => Run <span style="background-color:#FF8C00">&nbsp;```$ suman --init```</span>

You have installed Suman, and now you will see that you have some new files in your project. 
You have a <span style="background-color:#DCDCDC">```suman.conf.js```</span> file at the root of your project.
You also have a directory called suman at the root of your project which contains 3 files, <span style="background-color:#DCDCDC">```suman.once.js```</span>, <span style="background-color:#DCDCDC">```suman.order.js```</span>,
<span style="background-color:#DCDCDC">```suman.ioc.js```</span>. If you want to find out what these files are for, go to the Advanced Usage section from the home page, 
but for now, if you are brand new to suman you can ignore those and come back to them later.

## Alright, let's run a test

Individual test suite files can be run with either <span style="background-color:#9ACD32">&nbsp;```$ node path/to/your-test.js```</span> 
or <span style="background-color:#9ACD32">&nbsp;```$ suman path/to/your-test.js```</span>,
the result is the same.

To use the Suman runner, you use <span style="background-color:#9ACD32">&nbsp;```$ suman --rnr path/to/your-test.js```</span>  or simply point suman to a directory like so <span style="background-color:#9ACD32">&nbsp;```$ suman path/to/tests/folder```</span>
and suman will use the runner, because if you point Suman at a folder, Suman must use the Suman runner to run the tests. 
If you point Suman at an individual test file, you the developer have the choice about whether to use the runner or not, using the <span style="background-color:#9ACD32">```--rnr```</span> flag.

The biggest advantage of using the runner with a single test file is that the runner can suppress your
console.log/debugging output, because using the runner will run your test suite in a child_process.

Here is a simple test file you can use to try Suman out, put the code in any .js file and run it with one of the above commands.

<br>
Save the file in some directory as simple-test.js and then run, ```$ node simple-test.js```
So simple :)
You can even do fun things like ```cat simple-test.js | node```, if you want.
<br>

```js

const suman = require('suman');
const Test = suman.init(module);


Test.describe('SimpleTest', function (assert, fs, http, os) {


    this.it('tests-arrays', function () {
        assert.equal(typeof [], 'object');
    });


    ['describe', 'it', 'before', 'beforeEach', 'after', 'afterEach'].forEach(item => {

        this.it('tests-suman suite block for: ' + item, function () {
            assert(this.hasOwnProperty(item));
        });

    });

    this.it('Check that Test.file is equiv. to module.filename', {timeout:20},  done => {
        setTimeout(function(){
            assert(module.filename === Test.file);
            done();
        },19);
    });


    this.it('reads this file, pipes to /dev/null', (fail, pass) => {

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

```


here's some gist

<script src="https://gist.github.com/ORESoftware/0c772aedd3630bb54f27.js"></script>