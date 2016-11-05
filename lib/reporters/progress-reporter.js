//core
const util = require('util');

//npm
const ProgressBar = require('progress');
const suman = require('suman');

////////////////////////////////////////

function onAnyEvent (data) {
    process.stdout.write(data);
}

module.exports = s => {

  var progressBar;

  s.on('runner-started', function onRunnerStart (totalNumTests) {

    console.log('\n');

    progressBar = new ProgressBar(' => progress [:bar] :percent :current :token1 :token2', {
        total: totalNumTests,
        width: 120
      }
    );
  });

  s.on('test-end', function onTestEnd (d) {
    // process.stdout.write('\n\n');
    // process.stdout.write(' Test finished with exit code = ' + d.exitCode + ' => path => ' + d.testPath);
    // process.stdout.write('\n\n');
    progressBar.tick({
      'token1': "",
      'token2': ""
    });
  });

  s.on('suman-runner-exit-code', onAnyEvent);

  s.on('runner-end', function onRunnerEnd () {
       console.log(' => Runner end event fired.');
  });

  s.on('suite-skipped', function onRunnerEnd () {

  });

  s.on('suite-end', function onRunnerEnd () {

  });

};