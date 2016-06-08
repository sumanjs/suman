/**
 * Created by denman on 5/23/2016.
 */


//core
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

//npm
const async = require('async');
const colors = require('colors/safe');

//project
const sumanUtils = require('../utils');

function run(paths, opts, cb) {

	const testDir = global._sTestDir;
	const testSrcDir = global._sTestSrcDir;
	const testDestDir = global._sTestDestDir;
	const testDirCopyDir = global._sTestDirCopyDir;
	const root = String(global.projectRoot);
	
	// const result = dirs.every(function (dir) {
	// 	try {
	// 		assert(String(dir).indexOf(path.sep) < 1);
	// 	}
	// 	catch (err) {
	// 		return false;
	// 	}
	// 	return true;
	// });
	//
	// if (!result) {
	// 	return cb(new Error('Please pass only relative paths to top-level directories in your project.'));
	// }
	// else {
	// 	dirs = dirs.map(function (dir) {
	// 		return path.resolve(dir);
	// 	});
	// }
	
	// dirs = dirs.map(function (dir) {
	// 	return path.resolve(dir);
	// });

	const targetDir = path.resolve(testDirCopyDir ? testDirCopyDir : (testDir + '-target'));
	
	if (opts.all) {
		
		// if (dirs.length < 1) {
		//     if (testDir && typeof testDir === 'string') {
		//         dirs = [testDir];
		//     }
		//     else {
		//         return cb(new Error('No test directory specified at command line, and no testDir property defined in your suman config.'))
		//     }
		// }
		
		try {
			assert(testDir && typeof testDir === 'string');
		}
		catch (err) {
			return cb(new Error('You wanted a transpilation run, but you need to define the testDir ' +
				'property in your suman.conf.js file.' + '\n' + err.stack));
		}
		
		if (paths.length > 0) {
			console.error(colors.yellow(' => Suman warning => Because the --all option was used,' +
				' suman will ignore the following arguments passed at the command line:'), '\n', paths);
		}
		
		//TODO: use rimraf or what not, instead of cp
		cp.exec('rm -rf ' + targetDir, function (err, stdout, stderr) {
			if (err || String(stdout).match(/error/i) || String(stderr).match(/error/i)) {
				cb(err || stdout || stderr);
			}
			else {
				
				const cmd1 = 'cd ' + root + ' && babel ' + testDir + ' --out-dir ' + targetDir
					+ ' --copy-files';
				
				if (opts.verbose) {
					console.log('\n', 'Babel-cli command:', cmd1, '\n');
				}
				
				cp.exec(cmd1, function (err) {
					if (err || String(stdout).match(/error/i) || String(stderr).match(/error/i)) {
						cb(err || stdout || stderr);
					}
					else {
						console.log(stdout ? '\n' + stdout : '');
						console.log(stderr ? '\n' + stderr : '');
						
						if (!global.sumanOpts.sparse) {
							console.log('\t' + colors.bgGreen.white.bold(' => Suman messsage => Your entire "' + testDir + '" directory '));
							console.log('\t' + colors.bgGreen.white.bold(' was successfully transpiled/copied to the "' + targetDir + '" directory. ') + '\n');
						}
						
						setImmediate(function () {
							cb(null);
						});
						
						// const cmd2 = 'cd ' + root + ' && babel ' + testDir + ' --out-dir test-target'
						// 	+ ' --only ' + dirs[0];
						//
						// if (opts.verbose) {
						// 	console.log('\n', 'Babel-cli command 2:', cmd2, '\n');
						// }
						//
						// cp.exec(cmd2, cb);
					}
					
				});
				
				/*		async.each(dirs, function (item, cb) {
				 
				 item = path.resolve(path.isAbsolute(item) ? item : (root + '/' + item));
				 
				 // const truncated = sumanUtils.removeSharedRootPath([item, targetTestDir]);
				 // const file = truncated[0][1];
				 // const indexOfFirstStart = String(file).indexOf('*');
				 // var temp = String(file);
				 // if (indexOfFirstStart > -1) {
				 // 	temp = temp.substring(0, indexOfFirstStart);
				 // }
				 
				 // console.log('temp:',temp);
				 
				 // const cmd = 'cd ' + root + ' && babel ' + item + ' --out-dir test-target' + temp + ' --copy-files';
				 
				 const cmd = 'cd ' + root + ' && babel ' + item + ' --out-dir test-target' + ' --copy-files';
				 
				 if (opts.verbose) {
				 console.log('\n', 'Babel-cli command:', cmd, '\n');
				 }
				 
				 cp.exec(cmd, cb);
				 
				 }, cb);*/
			}
			
		});
	}
	else {  //opts.all == false
		
		//here we want two things to be faster:
		//no runner, so we save 100ms
		//transpile and option to only copy only 1 .js file
		
		// if (dirs.length > 0) {
		// 	return cb(new Error('--optimized option uses the testSrcDirectory property of your config, ' +
		// 		'but you specified a dir option as an argument.'))
		// }
		//
		// dirs = [testDir];
		
		if (opts.sameDir) {
			try {
				assert(testDir && testSrcDir && testDestDir &&
					typeof testDir === 'string' && typeof testSrcDir === 'string' && typeof testDestDir === 'string');
			}
			catch (err) {
				return cb(new Error('You wanted an transpilation run, but you need to define the testDir ' +
					'and testSrcDir properties in your suman.conf.js file.'))
			}
			
			cp.exec('cd ' + root + ' && rm -rf ' + testDestDir, function (err, stdout, stderr) {
				if (err || String(stdout).match(/error/i) || String(stderr).match(/error/i)) {
					cb(err || stdout || stderr);
				}
				else {
					// async.each(dirs, function (item, cb) {
					//
					// 	// item = path.resolve(path.isAbsolute(item) ? item : (root + '/' + item));
					//
					// 	const cmd = 'cd ' + root + ' && babel ' + item + ' --out-dir ' + str3 + ' --only ' + item;
					//
					// 	if (opts.verbose) {
					// 		console.log('\n', 'Babel-cli command:', cmd, '\n');
					// 	}
					//
					// 	cp.exec(cmd, cb);
					//
					// }, cb);
					
					// const cmd = 'cd ' + root + ' && babel ' + str2 + ' --out-dir ' + str3 + ' --only ' + item;
					
					var cmd = 'cd ' + root + ' && babel ' + testSrcDir + ' --out-dir ' + testDestDir;
					
					paths.forEach(function (item) {
						cmd += ' --only ' + item;
					});
					
					if (opts.verbose) {
						console.log('\n', 'Babel-cli command:', cmd, '\n');
					}
					
					cp.exec(cmd, cb);
					
				}
			});
			
		}
		else {
			
			try {
				assert(paths.length > 0, colors.bgBlack.yellow(' => Suman error => please pass at least one test file path in your command.'));
			}
			catch (err) {
				return cb(err);
			}
			
			async.map(paths, function (item, cb) {
				
				item = path.resolve(path.isAbsolute(item) ? item : (root + '/' + item));

				if(opts.vverbose || process.env.SUMAN_DEBUG === 'yes'){
					console.log('Item to be transpiled:', item);
					console.log('Root of project:', root);
				}

				const paths = sumanUtils.removeSharedRootPath([root, item]);
				
				const temp = paths[1][1];

				if(opts.vverbose || process.env.SUMAN_DEBUG === 'yes'){
					console.log('temp path:', temp);
				}

				const splitted = temp.split(path.sep);
				
				splitted.shift();
				splitted.shift();
				
				const joined = splitted.join(path.sep);

				if(opts.vverbose || process.env.SUMAN_DEBUG === 'yes'){
					console.log('pre-resolved:', joined);
				}
				
				const fsItem = path.resolve(targetDir + '/' + joined);

				if(opts.vverbose || process.env.SUMAN_DEBUG === 'yes'){
					console.log('targetDir:', targetDir);
					console.log('fsItem:', fsItem);
				}
				
				var cmd;
				try {
					if (fs.statSync(item).isFile()) {
						if (path.extname(item) === '.js' || path.extname(item) === '.jsx') {
							cmd = 'cd ' + root + ' && babel ' + item + ' --out-file ' + fsItem;
							console.log('\n ' + colors.bgCyan.magenta.bold(' => Test file will be transpiled to => ' + fsItem));
						}
						else {
							cmd = 'cd ' + root + ' && cp ' + item + ' ' + fsItem;
							console.log('\n ' + colors.bgCyan.magenta.bold(' => Test fixture file will be copied to => ' + fsItem));
						}
					}
					else {
						cmd = 'cd ' + root + ' && babel ' + item + ' --out-dir ' + fsItem + ' --copy-files';
						console.log(' ' + colors.bgCyan.white.bold(' => Test dir will be transpiled to =>'),'\n', colors.bgMagenta.white(fsItem));
					}
					
				}
				catch (err) {
					return cb(err);
				}
				
				if (opts.verbose) {
					console.log('\n', 'Babel-cli command:', cmd, '\n');
				}
				
				cp.exec(cmd, function (err, stdout, stderr) {
					if (err || String(stdout).match(/error/i) || String(stderr).match(/error/i)) {
						cb(err || stdout || stderr);
					}
					else {
						cb(null, fsItem)
					}
				});
				
			}, cb);
			
		}
		
	}
	
}

module.exports = run;
