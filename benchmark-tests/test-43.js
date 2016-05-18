/**
 * Created by Olegzandr on 5/17/16.
 */

const assert = require('assert');

const val = process.env.NUM_OF_NETWORK_CALLS;

const suman = require('../lib');
const Test = suman.init(module, {});


console.log('num of network calls:',val);

Test.describe('benchmark-test', {mode: 'series'}, function () {

	for (var i = 0; i < val; i++) {

		this.it.cb('test-' + i, t => {
			setTimeout(function () {
				t.done();
			}, 500);
		});

	}

});