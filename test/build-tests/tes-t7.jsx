/**
 * Created by denman on 1/2/2016.
 */



const Test = require('../../lib').init(module, {
    export: false,
    integrants: ['smartconnect', 'dolce-vida'],
    iocData: {  //we pass this data to ioc file
        choodles: function () {

        }
    }
});


Test.describe('Suite7', {parallel: true}, function (fs, extra, choodles, assert) {


    console.log('extra:', extra);
    console.log('choodles:', choodles);


    this.before(ctn => {
        ctn();
    });

    this.beforeEach.cb({}, (ctn, t) => {
        // t.assert(false);
        ctn();
    });

    this.it('has one', function () {

    });

    this.describe('loop', function (delay) {

        [1, 2, 3, 4, 5, 6].forEach(val=> {

            this.it.cb('tests ' + val, {parallel: !!val}, function (t) {

                // assert(false);
                //this.should.have.property('name', 'tj');

                t.pass();

            });
        });

        //delay

    });


    this.describe('1', {efa: true}, function () {

        this.before((done) => {

            setTimeout(function () {
                done();
            }, 10);

        });

        this.it.cb('[test] yo 1', {parallel: true}, (t) => {

            fs.createReadStream('/dev/null').pipe(fs.createWriteStream('/dev/null')).on('error', t.fail).on('finish', t.pass);

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

        this.it('chubs', {parallel: false, plan: 3}, (t, done) => {

            t.assert(false);
            t.assert(false);
            t.assert(false);

            setTimeout(function () {
                done();
            }, 100);

        });

    });

});

