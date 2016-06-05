
//core
const assert = require('assert');

//project
const proto = require('./t-proto');

function makeT(test, assertCount) {

	var planCalled = false;

	//NOTE: do not make any references to "this" in any prototype function because "this" may not be bound if the
	//the user passes the function directly, and does not call the function with "t" as in "t.x()" but instead
	//just calls "x()"

	function T(handleError) {
		this.__handle = handleError;
		this.value = test.value;
		this.testId = test.testId;
		this.desc = this.title = test.desc;
		this.data = test.data;
	}

	T.prototype = Object.create(proto);

	T.prototype.plan = function plan(num) {
		if (!planCalled) {
			planCalled = true;
			assert(typeof num === 'number');
			test.plan = num;
		}
		else{
			console.error(' => Suman warning => t.plan() called twice.');
		}
	};

	T.prototype.confirm = function confirm() {
		assertCount.num++;
	};


	return T;

}

module.exports = makeT;