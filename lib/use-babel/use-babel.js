/**
 * Created by Olegzandr on 5/18/16.
 */


const cp = require('child_process');

const installsGroupA = [
	'install',
	'-g',
	'babel-cli',
	'babel-core',
	'babel-loader',
	'babel-polyfill',
	'babel-runtime',
	'babel-plugin-transform-runtime',
	'babel-preset-es2015',
	'babel-preset-es2016',
	'babel-preset-react',
	'babel-preset-stage-0',
	'babel-preset-stage-1',
	'babel-preset-stage-2',
	'babel-preset-stage-3'
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
		console.log(' => if using "sudo" makes you unhappy, try "# chown -R $(whoami) $(npm root -g) $(npm root) ~/.npm"');
		console.log(' => To override, use --force\n');
		return;
	}

	console.log('Installing Babel may take awhile, it may be a good time to take a break.');

	const i = setInterval(function () {
		process.stdout.write('.');
	}, 500);

	const n = cp.spawn('npm', installsGroupA);

	n.on('close', function () {
		cb.apply(null, arguments);
	});

	n.stderr.setEncoding('utf-8');

	var first = true;

	n.stderr.on('data', function (d) {
		if (first) {
			first = false;
			clearInterval(i);
			console.log('\n');
		}
		console.error(d);
	});

};