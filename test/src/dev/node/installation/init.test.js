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
      stdout && h.log('which suman stdout', String(stdout).trim());
      stderr && h.log('which suman stderr', String(stderr).trim());
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
      cwd: p,
      env: Object.assign({}, process.env, {
        SUMAN_FORCE_GLOBAL: 'yes'
      })
    });

    let stderr = '';
    k.stderr.on('data', function (d) {
      stderr += String(d);
    });

    k.stdin.end(`\n unset -f suman && suman --init;  \n`);

    let regex = /Perhaps.*npm init/ig;

    k.once('exit', function (code) {

      try {
        assert(regex.test(stderr), 'stderr should match regex: ' + regex);
        assert(code > 0, 'exit code is not greater than 0, but it should be');
      }
      catch (err) {
        console.log('mucho error => ', stderr);
        t.log('stderr', stderr);
        return t.done(err);
      }

      t.done();
    });

  });

  it.cb('tests install (expected success)', t => {

    const k = cp.spawn('bash', [], {
      cwd: p,
      env: Object.assign({}, process.env, {
        SUMAN_FORCE_GLOBAL: 'yes'
      })
    });

    let stderr = '';
    k.stderr.on('data', function (d) {
      stderr += String(d);
    });

    k.stdin.end(`\n unset -f suman && npm init -f && suman --init;  \n`);

    let regex = /Perhaps*.npm init/;

    k.once('exit', function (code) {
      t.assert(code === 0, 'exit code should be zero');
      t.done();
    });

  });

  after(h => {
    h.assert(false);
  });

});
