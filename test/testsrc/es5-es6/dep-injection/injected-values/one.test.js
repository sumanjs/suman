const suman = require('suman');
const Test = suman.init(module, {});

Test.create('example', function (before, describe, inject) {

    inject(t => {

        return {
            sam: Promise.resolve(5)
        }

    });

    describe('inner-hooks', function (before, sam) {

        console.log('sam => ', sam);

        before('makes testing fun', t => {

            t.on('done', function () {
                console.log('t is done (b1) !');
            })

        });

        before('makes testing fun', t => {

            t.on('done', function () {
                console.log('t is done (b2) !');
            });

        });

        before('makes testing fun', t => {

            t.on('done', function () {
                console.log('t is done (b3) !');
            });

        });
    });

    describe('inner', function (it) {

        it('makes testing fun', t => {

            t.on('done', function () {
                console.log('t is done (1) !');
            })

        });

        it('makes testing fun', t => {

            t.on('done', function () {
                console.log('t is done (2) !');
            });

        });

        it('makes testing fun', t => {

            t.on('done', function () {
                console.log('t is done (3) !');
            });

        });
    });


});

