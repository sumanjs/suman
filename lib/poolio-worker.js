/**
 * Created by Olegzandr on 6/5/16.
 */



process.on('message', function(m){

	const fp = m.msg.testPath;

	// console.log('message:',m);

	// process.argv.push('--runner');
	process.argv.push(fp);

	// console.log('here are process.argv args:\n');
	// process.argv.forEach((val, index, array) => {
	// 	console.log(`${index}: ${val}`);
	// });

	require('../index');

});