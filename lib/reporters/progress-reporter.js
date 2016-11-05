//core
const util = require('util');

//npm
const ProgressBar = require('progress');
const suman = require('suman');

////////////////////////////////////////

module.exports = s => {

  var progressBar;

  s.on('runner-started', function onRunnerStart (totalNumTests) {

    console.log('total number of tests:', totalNumTests);
    progressBar = new ProgressBar(' => progress [:bar] :percent :current :token1 :token2', {
        total: totalNumTests + 1,
        width: 120
      }
    );

  });

  s.on('test-end', function onTestEnd (d) {
    process.stdout.write('\n\n');
    process.stdout.write(' Test finished with exit code = ' + d.exitCode + ' => path => ' + d.testPath);
    process.stdout.write('\n\n');
    progressBar.tick({
      'token1': "",
      'token2': ""
    });
    process.stdout.write('\n\n');
  });

  s.on('runner-end', function onRunnerEnd () {
    console.log('runner end!!');
    progressBar.tick({
      'token1': "Runner",
      'token2': "end!"
    });
  });

  s.on('suite-skipped', function onRunnerEnd () {

  });

  s.on('suite-end', function onRunnerEnd () {

  });

};