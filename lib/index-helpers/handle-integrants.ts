'use strict';

//typescript imports
import {IGlobalSumanObj} from "../../dts/global";
import EventEmitter = NodeJS.EventEmitter;
import {IIntegrantsMessage, ISumanModuleExtended} from "../../dts/index-init";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import util = require('util');
import EE = require('events');

//npm
import * as chalk from 'chalk';
import * as fnArgs from 'function-arguments';
import su from 'suman-utils';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

if (!('integrantHashKeyVals' in _suman)) {
  Object.defineProperty(_suman, 'integrantHashKeyVals', {
    writable: false,
    value: {}
  });
}

const integrantsEmitter = _suman.integrantsEmitter = (_suman.integrantsEmitter || new EE());
const {acquireDependencies} = require('../acquire-dependencies/acquire-pre-deps');
import {constants} from '../../config/suman-constants';
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

  if (integrants.length < 1) {

    integrantsFn = function (emitter: EventEmitter) {
      process.nextTick(function () {
        if (emitter) {
          //this emitter is sumanEvents for single process mode
          emitter.emit('vals', {});
        }
        else {
          integrantsEmitter.emit('vals', {});
        }
      });
    }
  }
  else if (_suman.usingRunner) {

    const client = getClient();

    integrantsFn = function () {

      const integrantsFromParentProcess: Array<any> = [];
      let oncePreVals: any;

      if (integrantsReady) {
        process.nextTick(function () {
          integrantsEmitter.emit('vals', {});
        });
      }
      else {
        let integrantMessage = function (msg: IIntegrantsMessage) {
          if (msg.info === 'all-integrants-ready') {
            oncePreVals = JSON.parse(msg.val);
            integrantsReady = true;
            if (postOnlyReady !== false) {
              process.removeListener('message', integrantMessage);
              integrantsEmitter.emit('vals', oncePreVals);
            }
          }
          else if (msg.info === 'integrant-error') {
            process.removeListener('message', integrantMessage);
            integrantsEmitter.emit('error', msg);
          }
          else if (msg.info === 'once-post-received') {
            // note: we need to make sure the runner received the "post" requirements of this test
            // before this process exits
            postOnlyReady = true;
            if (integrantsReady !== false) {
              process.removeListener('message', integrantMessage);
              integrantsEmitter.emit('vals', oncePreVals);
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

        // process.on('message', integrantMessage);
        //
        // process.send({
        //   type: constants.runner_message_type.INTEGRANT_INFO,
        //   msg: integrants,
        //   oncePost: $oncePost,
        //   expectedExitCode: _suman.expectedExitCode,
        //   expectedTimeout: _suman.expectedTimeout
        // });
      }
    }
  }
  else {

    integrantsFn = function (emitter: EventEmitter) {

      //declared at top of file
      if (!integPreConfiguration) {
        const args = fnArgs(integrantPreFn);
        console.log('integrantPreFn => ', integrantPreFn);
        const ret = integrantPreFn.apply(null, integrantInjector(args));

        if (ret && su.isObject(ret.dependencies)) {
          integPreConfiguration = ret.dependencies;
        }
        else {
          throw new Error(' => <suman.once.pre.js> file does not export an object with a property called "dependencies"...\n' +
            (ret ? `Exported properties are ${util.inspect(Object.keys(ret))}` : ''));
        }
      }

      const d = domain.create();

      d.once('error', function (err: Error) {
        console.error(chalk.magenta(' => Your test was looking to source the following integrant dependencies:\n',
          chalk.cyan(util.inspect(integrants)), '\n', 'But there was a problem.'));

        err = new Error(' => Suman fatal error => there was a problem verifying the ' +
          'integrants listed in test file "' + $module.filename + '"\n' + (err.stack || err));
        console.error(err.stack || err);

        _suman._writeTestError(err.stack || err);
        process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
      });

      d.run(function () {

        // with suman single process, or not, we acquire integrants the same way
        acquireDependencies(integrants, integPreConfiguration).then(function (vals: Object) {
          d.exit();
          process.nextTick(function () {
            integrantsEmitter.emit('vals', Object.freeze(vals));
          });
        }, function (err: Error) {
          d.exit();
          process.nextTick(function () {
            integrantsEmitter.emit('error', err);
          });
        });

      });
    }
  }

  return integrantsFn;
};
