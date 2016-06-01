
### :: Installation ::

1. => <span style="background-color:#FF8C00">&nbsp;```$ npm install -g suman```</span>

2. => cd into the project where you want to use Suman to power your tests

3. => Run <span style="background-color:#FF8C00">&nbsp;```$ suman --init```</span>

You have installed Suman, and now you will see that you have some new files in your project. 
You have a <span style="background-color:#DCDCDC">```suman.conf.js```</span> file at the root of your project. This file must remain at the root of your project.
You also have a directory called suman at the root of your project which contains several files and folders, <span style="background-color:#DCDCDC">```suman.once.js```</span>, <span style="background-color:#DCDCDC">```suman.order.js```</span>,
<span style="background-color:#DCDCDC">```suman.ioc.js```</span>. If you want to find out what these files are for, go to the Advanced Usage section from the home page, 
but for now, if you are brand new to suman you can ignore those and come back to them later. If you wish to move the suman directory away from the root directory of your project, we recommend putting
the suman folder in your test directory. Note that once you run ```$ suman --init``` for your project and commit the code to source control,
you won't have to run it again later on in your CI/CD pipeline, so there is no need to install suman globally on any machine but a dev box. In order to use Babel with Suman, please
see the using Babel section. Babel is not included with the standard install because it is too heavy.

## Alright, let's run a test

Individual test suite files can be run with either <span style="background-color:#9ACD32">&nbsp;```$ node path/to/your-test.js```</span> 
or <span style="background-color:#9ACD32">&nbsp;```$ suman path/to/your-test.js```</span>,
the result is the same, if you don't use any other command line options.

To use the Suman runner with a single test, you use <span style="background-color:#9ACD32">&nbsp;```$ suman --rnr path/to/your-test.js```</span>  If suman is run against a folder with multiple test files, like so: <span style="background-color:#9ACD32">&nbsp;```$ suman path/to/tests/folder```</span>
suman will use the runner, as Suman always uses the Suman runner with multiple files. As you may have figured out, 
if you point Suman at an individual test file, you the developer have the choice about whether to use the runner or not, using the <span style="background-color:#9ACD32">```--rnr```</span> flag.
The Suman runner is designed to manage and orchestrate the execution of all your tests in separate processes, and basically do central control.

    Advantages of runner

    * The biggest advantage of using the runner with a *single test file* is that the runner can suppress your
    console.log/debugging output, making it easier to see the actual results of the test.

    Disadvantages of runner
    
    * 50-100ms slower to finish for a single test
    * Harder to debug
    

Here is a simple test file you can use to try Suman out, put the code in any .js file and run it with one of the above commands.

<br>
Save the file in some directory as simple-test.js and then run, ```$ node simple-test.js```
So simple, and it should feel great to be able to just run a test with node instead of some funky foreign command line app :)
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


here's some gist (add a github gist if necessary)

<script src="https://gist.github.com/ORESoftware/0c772aedd3630bb54f27.js"></script>