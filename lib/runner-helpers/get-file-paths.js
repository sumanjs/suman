/**
 * Created by Olegzandr on 6/14/16.
 */


//core
const path = require('path');
const fs = require('fs');

//npm
const _ = require('lodash');

//project
const runnerLogger = require('../sync-logger');


module.exports = function getFilePaths(dirs, match, notMatch) {

	const files = [];

	function matchesInput(filename) {
		return match.every(function (regex) {
			return !String(filename).match(regex);
		});
	}

	function doesNotMatchNegativeMatchInput(filename) {
		return notMatch.every(function (regex) {
			//mystery why this works, would assume it would be:
			//return !String(filename).match(regex);
			//but instead the following seems to work
			return String(filename).match(regex);
		});
	}

	dirs.forEach(function (dir) {

		(function getAllFiles(dir, isFile) {

			if (!path.isAbsolute(dir)) {
				dir = path.resolve(root + '/' + dir); //TODO fix this path?
			}
			//else {
			// TODO: handle "absolute" dirs correctly
			//    console.log('You have passed an absolute file or directory:', dir);
			//}

			var stat;

			if (isFile === true || ((stat = fs.statSync(dir)) && stat.isFile())) {

				const baseName = path.basename(dir);

				if (path.extname(baseName) !== '.js') {
					runnerLogger.log('\n => You may have wanted to run the file with this name:' + dir + ', but it is not a .js file\n');
					return;
				}

				const baseNameWithoutExtension = path.basename(dir, '.js'); //now we just look at the name of the file without extension

				if (matchesInput(dir) && doesNotMatchNegativeMatchInput(dir)) {
					if (global.sumanOpts.verbose) {
						runnerLogger.log('\n => You may have wanted to run file with this name:' + dir + ', but it didnt match the regex(es) you passed in as input.');
					}
					return;
				}

				// if (grepFileBaseName && !(String(baseName).search(grepFileBaseName) > -1)) {
				// 	if (global.sumanOpts.verbose) {
				// 		runnerLogger.log('\n => You may have wanted to run file with this name:' + dir + ', but it didnt match the regex you passed in:' + grepFileBaseName + '\n');
				// 	}
				// 	return;
				// }

				const file = path.resolve(dir);
				if (_.includes(files, file)) {
					console.log(colors.magenta(' => Suman warning => the following filepath was requested to be run more than once, Suman will only run files once per run! =>'), '\n', file);
				}
				else {
					files.push(file);
				}

			}

			else {

				try {
					stat = stat || fs.statSync(dir);
				}
				catch (err) {
					console.log(err.stack);
					return;
				}

				fs.readdirSync(dir).forEach(function (file) {

					const fileName = String(file);

					file = path.resolve(dir + '/' + file);

					var stat;

					try {
						stat = fs.statSync(file)
					}
					catch (err) {
						console.error(err.stack);
						return;
					}

					if (stat.isFile() && path.extname(file) === '.js') {

						// if (grepFile && !(String(fileName).search(grepFile) > -1)) {  //if grepFile regex is defined, we need to make sure filename matches the search
						//     runnerLogger.log('\n => Suman message => skipping file with this name: "' + colors.cyan(fileName) + '"\n   due to the regex you passed in for --grep-file: ' + grepFile + '\n');
						// }
						// else {
						//     files.push(file); //we have a match
						//     allFiles.push(file);
						// }

						getAllFiles(file, true);
					}
					else if (stat.isDirectory() && global.sumanOpts.recursive) {

						getAllFiles(file, false);
					}
					else {

						if (global.sumanOpts.debug || global.sumanOpts.verbose) {
							const msg = [
								'\n\t => Suman message => You wanted to run the file with this path:',
								colors.cyan(String(file)),
								'...but it is either a folder or is not a .js file',
								'if you want to run *subfolders* you shoud use the recursive option -r',
								'...be sure to only run files that constitute Suman tests, to enforce this we',
								'recommend a naming convention to use with Suman tests, see: oresoftware.github.io/suman\n\n'
							];

							runnerLogger.logArray(msg);
						}

					}

				});
			}

		})(dir)
	});

	return files;
};