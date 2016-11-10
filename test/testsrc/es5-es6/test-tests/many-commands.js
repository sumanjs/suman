const suman = require('suman');
const Test = suman.init(module, {});

Test.describe('Run many different options with Suman', {}, function (child_process) {   // we define the root suite


    this.describe('child suite A', {parallel:true}, function () {  //calling 'this.describe' creates a child suite


        this.it.cb('shakes babies', {mode: 'parallel'}, t => {


            child_process.exec('node index --tail-runner', {
                cwd: global.projectRoot


            }, function (err, stdout, stderr) {

                if(String(stderr).match(/error/i)){
                    return t.fail(new Error(stderr));
                }

                t.done(err);

            });


        });


        this.it.cb('golly',{mode: 'parallel'}, t => {
            
            child_process.exec('node index --tail-test', {
                cwd: global.projectRoot

            }, function (err, stdout, stderr) {

                if(String(stderr).match(/error/i)){
                    return t.fail(stderr);
                }

                t.done(err);

            });


        });


        this.it.cb('booty',{mode: 'parallel'}, t => {


            child_process.exec('node index test/build-tests/test6.test.js', {

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