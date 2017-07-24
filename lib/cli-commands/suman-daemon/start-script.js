const util = require('util');
const path = require('path');
const cp = require('child_process');
const fs = require('fs');

const sumanIndex = process.env['SUMAN_LIBRARY_ROOT_PATH'];
const sumanProjectRoot = process.env['SUMAN_PROJECT_ROOT'];

process.on('message', function (msg) {

  const _suman = global.__suman = (global.__suman || {});

  _suman.absoluteLastHook = function () {
    try {
      cp.execSync(`kill -INT ${msg.msg.pid}`)
    }
    catch (err) {
      console.error(err.message);
    }
  };

  // process.once('exit', function () {
  //   try {
  //     cp.execSync(`kill -9 ${msg.msg.pid}`)
  //   }
  //   catch (err) {
  //     console.error(err.message);
  //   }
  // });

  msg.msg.args.forEach(function (a) {
    process.argv.push(a);
  });

  console.log(util.inspect(msg));

  process.argv.push('--force-inception-level-zero');
  process.env.SUMAN_EXTRANEOUS_EXECUTABLE = 'yes';
  // require(path.resolve(process.env.HOME + '/WebstormProjects/oresoftware/sumanjs/suman/test/regexp.js'));
  // require(path.resolve(process.env.HOME + '/WebstormProjects/oresoftware/sumanjs/suman/test/regexp.js'));
  require(path.resolve(sumanIndex + '/cli.js'));

});


const sumanFilesToLoad = [
  'lib/index.js',
  'lib/exec-suite.js',
  'lib/suman.js'
];

process.once('SIGINT', function () {
  console.log('SIGINT received by suman-d.');
  process.exit(1);
});

fs.readdirSync(path.resolve(sumanIndex + '/lib/test-suite-helpers'))
.filter(v => String(v).endsWith('.js'))
.forEach(function (item) {
  sumanFilesToLoad.push(`lib/test-suite-helpers/${item}`);
});

fs.readdirSync(path.resolve(sumanIndex + '/lib/test-suite-methods'))
.filter(v => String(v).endsWith('.js'))
.forEach(function (item) {
  sumanFilesToLoad.push(`lib/test-suite-methods/${item}`);
});

fs.readdirSync(path.resolve(sumanIndex + '/lib/injection'))
.filter(v => String(v).endsWith('.js'))
.forEach(function (item) {
  sumanFilesToLoad.push(`lib/injection/${item}`);
});

fs.readdirSync(path.resolve(sumanIndex + '/lib/helpers'))
.filter(v => String(v).endsWith('.js'))
.forEach(function (item) {
  sumanFilesToLoad.push(`lib/helpers/${item}`);
});

fs.readdirSync(path.resolve(sumanIndex + '/lib/index-helpers'))
.filter(v => String(v).endsWith('.js'))
.forEach(function (item) {
  sumanFilesToLoad.push(`lib/index-helpers/${item}`);
});

fs.readdirSync(path.resolve(sumanIndex + '/lib/acquire-dependencies'))
.filter(v => String(v).endsWith('.js'))
.forEach(function (item) {
  sumanFilesToLoad.push(`lib/acquire-dependencies/${item}`);
});

try {
  require(path.resolve(sumanProjectRoot + '/suman.conf.js'));
}
catch (err) {
  console.error(err.message);
}

const pkgJSON = require(path.resolve(sumanIndex + '/package.json'));

sumanFilesToLoad.forEach(function (dep) {
  try {
    let p = path.resolve(sumanIndex + '/' + dep);
    require(p);
  }
  catch (err) {
    console.error(err.message || err);
  }
});

Object.keys(pkgJSON.dependencies).forEach(function (k) {
  try {
    // console.log('attempting to load => ', k);
    require(k);
    // console.log('loaded 1 => ', k);
  }
  catch (err) {
    console.error(err.message || err);
    try {
      // console.log('attempting to load 2 => ', k);
      require(path.resolve(sumanProjectRoot + '/node_modules/' + k));
      console.log('loaded 2 => ', k);
    }
    catch (err) {
      console.error(err.message || err);
    }
  }
});
