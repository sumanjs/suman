/**
 * Created by denman on 1/2/2016.
 */



const Test = require('../../lib').init(module, {
    export: false,
    //integrants: ['smartconnect', 'dolce-vida'],
    ioc: {
        choodles: function(){
            
        }
    }
});


const d = require('domain').create();

d.on('error', function(err){

    console.error(err.stack);
});

d.run(function(){
    Test.describe('Suite7', {parallel: true}, function (fs, extra, choodles) {


        console.log('extra:',extra);


        this.before(ctn => {
            ctn();
        });

        this.beforeEach(t => {


        });

        this.describe('loop', function () {

            [1, 2, 3, 4, 5, 6].forEach(val=> {

                this.it('tests ' + val, {parallel: !!val}, function () {


                });
            })

        });


        this.describe('1', {efa: true}, function () {

            this.before((done) => {

                setTimeout(function () {
                    done();
                }, 10);

            });

            this.it('[test] yo 1', {parallel: true}, (t, fail, done, pass) => {

                fs.createReadStream('/dev/null').pipe(fs.createWriteStream('/dev/null')).on('error', fail).on('finish', pass);

            });


            this.it('[test] yo 2', {parallel: false}, function (t) {

                return new Promise(function (resolve, reject) {

                    resolve();

                });

            });

            //this.it('[test] yo 2', {parallel: false}, new Promise(function (resolve, reject) {
            //
            //    Promise.delay(1000).then(function () {
            //        resolve();
            //    });
            //
            //}).then(function(){
            //
            //
            //
            //}));


            function p(val) {
                return new Promise(function (resolve) {
                    resolve('doooog' + val);
                });
            }

            this.it('[test] gen', {parallel: false}, function *() {

                var t = yield 3;
                var val = yield p();
                val = yield p(val);

            });


            this.it('yo', {parallel: false}, (t, done) => {

                // throw new Error('PAsta');
                setTimeout(function () {

                    done();
                }, 100);

            });

            this.it('chubs', {parallel: false}, (t, done) => {

                setTimeout(function () {
                    done();
                }, 100);

            });

        });


        this.before(() => {

        });


    });

});




/*


 Test.describe('BBB2', function () {


 this.before(() => {


 }).beforeEach(() => {


 });


 this.describe('1', {efa: true}, function () {

 this.before((done) => {

 setTimeout(function () {
 done();
 }, 10);
 });

 this.it('[test] yo', {parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 600);

 });

 this.it('yo', {parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });

 this.it({parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });


 });


 this.before(() => {

 });


 });


 Test.describe('BBB2', function () {


 this.before(() => {


 }).beforeEach(() => {


 });


 this.describe('1', {efa: true}, function () {

 this.before((done) => {

 setTimeout(function () {
 done();
 }, 10);
 });

 this.it('[test] yo', {parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });

 this.it('yo', {parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });

 this.it({parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });


 });


 this.before(() => {

 });


 });
 */



