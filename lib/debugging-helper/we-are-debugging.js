/**
 * Created by denman on 3/26/2016.
 */


const argz = process.argv.slice(2);
const execArgs = process.execArgv.slice(0);

//////////////////////////////////////////////////////////

const isDebug = execArgs.indexOf('--debug') > -1;
if (isDebug) {
    console.log('=> we are debugging with the --debug flag');
}

const inDebugMode = typeof global.v8debug === 'object';

if (inDebugMode) {
    console.log('=> we are debugging with the debug execArg');
}


module.exports = global.weAreDebugging = (isDebug || inDebugMode);