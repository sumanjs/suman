const suman = require('suman');
const Test = suman.init(module, {});

Test.describe('Run many different options with Suman', {}, function (child_process) {   // we define the root suite

    const {exec} = child_process;

    return;

    this.describe('child suite A', {parallel:true}, function () {  //calling 'this.describe' creates a child suite

        this.it.cb('shakes babies', {mode: 'parallel'}, t => {

            exec('node cli.js --tail runner', {
                cwd: global.projectRoot


            }, function (err, stdout, stderr) {

                if(String(stderr).match(/error/i)){
                    return t.fail(new Error(stderr));
                }

                t.done(err);

            });


        });


        this.it.cb('golly',{mode: 'parallel'}, t => {
            
            exec('node cli.js --tail test', {
                cwd: global.projectRoot

            }, function (err, stdout, stderr) {

                if(String(stderr).match(/error/i)){
                    return t.fail(stderr);
                }

                t.done(err);

            });


        });


        this.it.cb('booty',{mode: 'parallel'}, t => {


            exec('node cli.js test/testsrc/es5-es6', {

                cwd: global.projectRoot

            }, function (err, stdout, stderr) {

                if(String(stderr).match(/error/i)){
                    return t.fail(stderr);
                }

                t.done(err);

            });


        });


    });


});
