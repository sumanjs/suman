'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');
const util = require('util');
const domain = require('domain');
const path = require('path');
const EE = require('events');

//npm
const {events} = require('suman-events');
const _ = require('lodash');
const su = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
const weAreDebugging = require('../helpers/we-are-debugging');
const acquireDeps = require('../acquire-deps');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =

  function makeHandleIntegrantInfo(runnerObj, allOncePostKeys, integrantHash, integrantHashKeyValsForSumanOncePost) {

    const verifyIntegrant = function (intg) {

      const depContainerObj = runnerObj.depContainerObj;
      const d = domain.create();

      d.once('error', function (err) {
        console.error(err ? (err.stack || err) : ' => Domain caught undefined/empty error.');
        const cps = integrantHash[intg];
        integrantHash[intg] = err;
        console.log(!Array.isArray(cps) ? '\n => for intg ="' + intg + '", cps in error => ' + util.inspect(cps) : '');
        if (Array.isArray(cps)) {
          cps.forEach(function (cp) {
            // TODO cps does not seem to be an array here
            cp.send({info: 'integrant-error', data: err});
            cp.kill('SIGINT');
          });
        }
        throw new Error(' => Suman usage error in suman.once.js for key => "' + intg + '"\n' + (err.stack || err));
      });

      let callable = true;

      const sendOutMsg = function (val) {

        if (!callable) {
          //make sure this function is only called once per intg key
          console.error(' => Suman usage warning in your suman.once.js file => \n' +
            '=> callback was fired twice for key = "' + intg + '"');
          return;
        }

        callable = false;
        const cps = integrantHash[intg];

        if (su.isSumanDebug()) {
          console.log(!Array.isArray(cps) ? '\n => for intg ="' + intg + '", cps => ' + util.inspect(cps) : '');
        }

        integrantHash[intg] = 'READY';
        integrantHashKeyValsForSumanOncePost[intg] = val;


        if (Array.isArray(cps)) {
          cps.forEach(function (cp) {
            cp.send({info: 'integrant-ready', data: intg, val: val});
          });
        }
        else {
          console.error(' => Suman implementation warning => cp array is not present.');
        }
      };

      d.run(function () {

        acquireDeps(_.flattenDeep([intg]), depContainerObj).then(function (data) {

          d.exit();
          process.nextTick(function () {
            // TODO: assert that value has been serialized (string, number, boolean, etc)
            su.runAssertionToCheckForSerialization(data);
            sendOutMsg(data);
          });

        }, function (err) {
          err = new Error(' => Suman fatal error => Suman had a problem verifying your integrants in ' +
            'your suman.once.js file. => \n' + util.inspect(err.stack || err));
          console.error(err);
          d.emit(err);
          d.exit();
        });

      });
    };

    return function handleIntegrantInfo(msg, n) {

      const oncePostKeys = msg.oncePost;

      if (Number.isInteger(msg.expectedExitCode)) {
        n.expectedExitCode = msg.expectedExitCode;
      }
      else if (msg.expectedExitCode !== undefined) {
        throw new Error(' => Suman implementation error => expected exit code not an integer ' +
          'for child process => ' + n.testPath);
      }

      if (Number.isInteger(msg.expectedTimeout)) {
        if (!weAreDebugging) {
          clearTimeout(n.to);
          n.to = setTimeout(function () {
            n.kill();
          }, msg.expectedTimeout);
        }

      }
      else if (msg.expectedTimeout !== undefined) {
        throw new Error(' => Suman implementation error => expected timeout not an acceptable integer ' +
          'for child process => ' + n.testPath);
      }

      //we want send back onlyPosts immediately because if we wait it blocks unnecessarily
      assert(Array.isArray(oncePostKeys), 'oncePostKeys is not an array type.');
      allOncePostKeys.push(oncePostKeys);


      process.nextTick(function () {
        n.send({
          info: 'once-post-received'
        });
      });

      if (oncePostKeys.length > 0 && !runnerObj.innited) {
        try {
          runnerObj.innited = true; //we only want to run this logic once
          let oncePostModule = runnerObj.oncePostModule = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.once.post.js'));
          assert(typeof  oncePostModule === 'function', 'suman.once.post.js module does not export a function.');
          runnerObj.hasOncePostFile = true;
        }
        catch (err) {
          console.error(colors.red(' => Suman usage warning => you have suman.once.post data defined, ' +
              'but no suman.once.post.js file.') + '\n' + (err.stack || err));
        }

      }

      const integrants = msg.msg;

      integrants.forEach(function (intg) {

        if (!(String(intg) in integrantHash)) {
          integrantHash[String(intg)] = [];
          integrantHash[String(intg)].push(n);   //store cps in hash, with integrant names as keys
          verifyIntegrant(intg);
        }
        else if (String(integrantHash[intg]).toUpperCase() === 'READY') {

          if (su.isSumanDebug()) {
            console.log(' => integrants READY =>', util.inspect(msg));
          }

          n.send({info: 'integrant-ready', data: intg, val: integrantHashKeyValsForSumanOncePost[intg]});
        }
        else if (integrantHash[intg] instanceof Error) {

          if (su.isSumanDebug()) {
            console.log(' => integrants error =>', util.inspect(integrantHash[intg]));
          }

          n.send({info: 'integrant-error', data: integrantHash[intg].stack});
        }
        else if (Array.isArray(integrantHash[intg])) {

          if (su.isSumanDebug()) {
            console.log('\n', ' => child process with filePath =>', n.testPath, '\n is being push to integrants array value for key =>', intg);
          }

          integrantHash[intg].push(n);

          if (su.isSumanDebug()) {
            console.log('\n', 'integrantHash for key = "' + intg + '", looks like => \n',
              integrantHash[intg].map(cp => 'cp with testPath =>' + cp.testPath))
          }
        }
        else {
          throw new Error('Unknown state of integrant readiness for integrant key => "' + intg + '",\n\n => ' +
            util.inspect(integrantHash));
        }

      });

    };
  };