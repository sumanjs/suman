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


    this.before.cb(t => {
        t.ctn();
    });

    this.beforeEach.cb({}, t => {
        // t.assert(false);
        t.ctn();
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

        delay();

    });


    this.describe('1', {efa: true}, function () {

        this.before.cb(t => {

            setTimeout(function () {
                t.done();
            }, 10);

        });

        this.it.cb('[test] yo 1', {parallel: true}, t => {

            fs.createReadStream('/dev/null').pipe(fs.createWriteStream('/dev/null')).on('error', t.fail).on('finish', t.pass);

        });


        this.it('[test] yo 2', {parallel: false}, t => {

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

        this.it('[test] gen', {parallel: false}, function *(t) {

            var val = yield p();
            val = yield p(val);

        });


        this.it.cb('yo', {parallel: false}, t => {

            // throw new Error('PAsta');
            setTimeout(function () {

                t.done();
            }, 100);

        });

        this.it.cb('chubs', {parallel: false, plan: 2}, t => {

            t.confirm();
            setTimeout(function () {
                t.confirm();
                t.done();
            }, 100);

        });

    });

});

