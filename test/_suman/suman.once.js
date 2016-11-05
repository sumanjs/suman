

//*************************************************************************************************************************************
// this is for dependency injection, y'all
// the purpose is to inject dependencies / values that are acquired *asynchronously*
// synchronous deps should be loaded with the require function, as per usual, but deps and values (such as db values) can and should be loaded via this module
// tests will run in separate processes, but you can use code sharing (not memory sharing) to share setup between tests, which is actually pretty cool
// ****************************************************************************************************************************************

module.exports = () => {  //load async deps for any of your suman tests

	return {

		'charlie': function () {

			console.log('charlie is running');

			return 'charlie';
		},
		'smartconnect': function () {

			console.log('smartconnect running...');

			return Promise.resolve(JSON.stringify({
				formica: 'not metal'
			}));

		},
		'dolce-vida': (cb) => {

			console.log('dolce-vida running...');

			setTimeout(function () {
				cb(null, "new Error('rub')");
			}, 10);

		},

		'mulch': (cb) => {

			setTimeout(function () {
				cb(null, "new Error('mulch')");
			}, 10);

		}


	}

};
