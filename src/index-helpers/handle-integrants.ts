'use strict';

// dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IIntegrantsMessage, ISumanModuleExtended} from "suman-types/dts/index-init";

// polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

// core
import domain = require('domain');
import util = require('util');
import EE = require('events');

// npm
import chalk from 'chalk';
import * as fnArgs from 'function-arguments';
import * as su from 'suman-utils';

// project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

if (!('integrantHashKeyVals' in _suman)) {
  Object.defineProperty(_suman, 'integrantHashKeyVals', {
    writable: false,
    value: {}
  });
}

const {acquirePreDeps} = require('../acquire-dependencies/acquire-pre-deps');
import {constants} from '../config/suman-constants';
import integrantInjector from '../injection/integrant-injector';
const IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
import {getClient} from './socketio-child-client';
let integPreConfiguration: any = null;

/////////////////////////////////////////////////////////////////////////////////////////////

export const handleIntegrants = function (integrants: Array<string>, $oncePost: Array<string>,
                                          integrantPreFn: Function, $module: ISumanModuleExtended) {

  let integrantsFn: Function = null;
  let integrantsReady: boolean = null;
  let postOnlyReady: boolean = null;

  const waitForResponseFromRunnerRegardingPostList = $oncePost.length > 0;
  const waitForIntegrantResponses = integrants.length > 0;

  if (waitForIntegrantResponses || IS_SUMAN_SINGLE_PROCESS) {
    integrantsReady = false;
  }

  if (waitForResponseFromRunnerRegardingPostList) {
    postOnlyReady = false;
  }

  let client: SocketIOClient.Socket, usingRunner = _suman.usingRunner;

  if (integrants.length < 1) {

    if (usingRunner) {
      // we should start establishing a connection now, to get ahead of things
      getClient();
    }

    integrantsFn = function () {
      return Promise.resolve({});
    }
  }
  else if (usingRunner) {

    client = getClient();

    integrantsFn = function () {

      return new Promise(function (resolve, reject) {
        let oncePreVals: any;

        let integrantMessage = function (msg: IIntegrantsMessage) {
          if (msg.info === 'all-integrants-ready') {
            oncePreVals = JSON.parse(msg.val);
            integrantsReady = true;
            if (postOnlyReady !== false) {
              resolve(oncePreVals);
            }
          }
          else if (msg.info === 'integrant-error') {
            reject(msg);
          }
          else if (msg.info === 'once-post-received') {
            // note: we need to make sure the runner received the "post" requirements of this test
            // before this process exits
            postOnlyReady = true;
            if (integrantsReady !== false) {
              resolve(oncePreVals);
            }
          }
        };

        const INTEGRANT_INFO = constants.runner_message_type.INTEGRANT_INFO;
        client.on(INTEGRANT_INFO, integrantMessage);

        client.emit(INTEGRANT_INFO, {
          type: INTEGRANT_INFO,
          msg: integrants,
          oncePost: $oncePost,
          expectedExitCode: _suman.expectedExitCode,
          expectedTimeout: _suman.expectedTimeout,
          childId: process.env.SUMAN_CHILD_ID
        });

      });

    }
  }
  else {

    integrantsFn = function () {

      //declared at top of file
      if (!integPreConfiguration) {
        const args = fnArgs(integrantPreFn);
        const ret = integrantPreFn.apply(null, integrantInjector(args, null));

        if (ret && su.isObject(ret.dependencies)) {
          integPreConfiguration = ret.dependencies;
        }
        else {
          throw new Error(' => <suman.once.pre.js> file does not export an object with a property called "dependencies"...\n' +
            (ret ? `Exported properties are ${util.inspect(Object.keys(ret))}` : ''));
        }
      }

      return new Promise(function (resolve, reject) {

        const d = domain.create();

        d.once('error', function (err: Error) {
          _suman.log.error(chalk.magenta('Your test was looking to source the following integrant dependencies:\n',
            chalk.cyan(util.inspect(integrants)), '\n', 'But there was a problem.'));

          err = new Error('Suman fatal error => there was a problem verifying the ' +
            'integrants listed in test file "' + $module.filename + '"\n' + (err.stack || err));
          _suman.log.error(err.stack || err);
          _suman.writeTestError(err.stack || err);
          process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
        });

        d.run(function () {

          if (!integPreConfiguration) {
            throw new Error('suman implementation error, missing definition.');
          }
          // with suman single process, or not, we acquire integrants the same way
          acquirePreDeps(integrants, integPreConfiguration).then(function (vals: Object) {
              d.exit();
              resolve(Object.freeze(vals));
            },
            function (err: Error) {
              d.exit();
              reject(err);
            });
        });
      });

    }
  }

  return integrantsFn;
};
