//core
import * as util from 'util';

/////////////////////////////////////////////////////////////////////

export const extractVals = function (val: any) {

  let fn: Function, subDeps: Array<string>, props: Array<string>, timeout: number;

  if (Array.isArray(val)) {
    fn = val[val.length - 1];
    val.pop();
    subDeps = val.filter(function (v) {
      if (v) {
        if (typeof v !== 'string') {
          throw new Error(' => There is a problem in your suman.once.pre.js file - ' +
            'the following key was not a string => ' + util.inspect(v));
        }
        if (String(v).indexOf(':') > -1) {
          props = props || [];
          props.push(v);
          return false;
        }
        return true;
      }
      else {
        console.error(' => You have an empty key in your suman.once.pre.js file.');
        console.error(' => Suman will continue optimistically.');
        return false;
      }
    });
  }
  else {
    subDeps = [];
    fn = val;
  }

  return {
    timeout,
    subDeps,
    fn,
    props
  }
};
