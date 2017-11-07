#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);
const {pt} = require('prepend-transform');

///////////////////////////////////////////////////////////////////////

Test.create(function (assert, describe, before, beforeEach, after, afterEach, it, $core, $deps) {

  const {child_process: cp, path} = $core;
  const {mkdirp, rimraf} = $deps;

  const p = path.resolve(process.env.HOME + '/suman-test/suman-install');

  before.cb('log suman installation path', h => {
    cp.exec('which suman', h.wrapErrorFirst(function (stdout, stderr) {
      stdout && console.log(String(stdout).trim());
      stderr && console.log(String(stderr).trim());
      h.done(String(stderr).trim());
    }));
  });

  beforeEach.cb('rimraf', h => {
    rimraf(p, h);
  });

  beforeEach.cb('mkdirp', h => {
    mkdirp(p, h);
  });

  it.cb('tests install (expected failure)', t => {

    const k = cp.spawn('bash', [], {
      cwd: p
    });

    let stderr = '';
    k.stderr.on('data', function (d) {
      stderr += String(d);
    });

    k.stdin.end(`\n suman --init;  \n`);

    let regex = /Perhaps*.npm init/;

    k.once('exit', function (code) {
      t.assert(code > 0, 'exit code is not greater than 0, but it should be');
      t.assert(regex.test(stderr), 'stderr should match regex: ' + regex);
    });

  });

  it.cb('tests install (expected success)', t => {

    const k = cp.spawn('bash', [], {
      cwd: p
    });

    let stderr = '';
    k.stderr.on('data', function (d) {
      stderr += String(d);
    });

    k.stderr.pipe(pt(' [suman init process stderr] ')).pipe(process.stderr);
    k.stdout.pipe(pt(' [suman init process stdout] ')).pipe(process.stdout);

    k.stdin.end(`\n npm init -f && suman --init;  \n`);

    let regex = /Perhaps*.npm init/;

    k.once('exit', function (code) {
      t.assert(code === 0, 'exit code should be zero');
    });

  });

  after(h => {
    h.assert(false);
  });

});
