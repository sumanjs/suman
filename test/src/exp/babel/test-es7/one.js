const suman = require('suman');
const Test = suman.init(module);


function makeProm(val) {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			resolve(val*5);
		});
	});
}

//

Test.create('a', function (assert, fs, describe, before, it) {

	describe('b', function () {

		before(function*(t) {

			const z = yield 3;
			const m = yield makeProm(z);
			assert.equal(m,15);

		});

		it('a', {value: 4}, function*(t) {

			const m = yield makeProm(t.value);
			yield assert.equal(m,20);

		});

		it('a', {value: 10}, function*(t) {

		});

	});

});
