/**
 * Created by Olegzandr on 5/18/16.
 */



const cp = require('child_process');

const installsGroupA = [
	'install',
	'-g',
	'babel-cli',
	'babel-core',
	// 'babel-loader',
	'babel-polyfill',
	'babel-runtime'
];

const installsGroupB = [
	'install',
	'-g',
	'babel-plugin-transform-runtime',
	'babel-preset-es2015',
	'babel-preset-es2016',
	'babel-preset-react',
	'babel-preset-stage-0',
	'babel-preset-stage-1',
	'babel-preset-stage-2',
	'babel-preset-stage-3'
];

module.exports = function initBabelGlobally(data, cb) {

	console.log('Installing the correct Babel dependencies globally using -g');

	if (!global.sumanOpts.force && !process.env.SUDO_UID) {
		console.log('You may wish to run the the commmand with root permissions, since you are installing globally');
		console.log('To override, use --force\n');
		return;
	}

	console.log('This may take awhile, it may be a good time to take a break.');

	var i = setInterval(function () {
		process.stdout.write('.');
	}, 500);

	// cp.exec('npm install -g ' + installs.join(' '), function () {
	// 	clearInterval(i);
	// 	cb.apply(null, arguments);
	// });

	const n = cp.spawn('npm', installsGroupA);

	n.on('close', function () {
		clearInterval(i);
		cb.apply(null, arguments);
	});

	n.stderr.setEncoding('utf-8');

	var first = true;

	n.stderr.on('data', function (d) {
		if (first) {
			console.error('\n' + d);
		}
		else {
			console.error(d);
		}

	});

};