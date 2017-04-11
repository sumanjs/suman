
//core
const path = require('path');


////////////////////////////////////////////////

function findPathOfRunDotSh(p){

  const root = global.projectRoot;
  const ln = root.length;

  while(p.length >= ln){

    let dirname = path.dirname(p);
    let map = global._suman.markersMap[dirname];
    if(map && map['@run.sh']){
      return path.resolve(dirname, '@run.sh');
    }

    p = path.resolve(p + '/../')

  }

  return null;
}

function findPathOfTransformDotSh(p){

  const root = global.projectRoot;
  const ln = root.length;

  while(p.length >= ln){

    let dirname = path.dirname(p);
    let map = global._suman.markersMap[dirname];
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
