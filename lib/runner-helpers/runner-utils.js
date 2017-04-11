'use strict';

//core
const path = require('path');

//project
const _suman = global.__suman = (global.__suman || {});

////////////////////////////////////////////////

function findPathOfRunDotSh(p){

  const root = _suman.projectRoot;
  const ln = root.length;

  while(p.length >= ln){

    let dirname = path.dirname(p);
    let map = _suman.markersMap[dirname];
    if(map && map['@run.sh']){
      return path.resolve(dirname, '@run.sh');
    }

    p = path.resolve(p + '/../')

  }

  return null;
}

function findPathOfTransformDotSh(p){

  const root = _suman.projectRoot;
  const ln = root.length;

  while(p.length >= ln){

    let dirname = path.dirname(p);
    let map = _suman.markersMap[dirname];
    if(map && map['@transform.sh']){
      return path.resolve(dirname, '@transform.sh');
    }

    p = path.resolve(p + '/../')

  }

  return null;
}

module.exports = {
  findPathOfRunDotSh,
  findPathOfTransformDotSh
};
