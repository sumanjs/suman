'use strict';


//project
const _suman = global.__suman = (global.__suman || {});

let maxMem = _suman.maxMem = {
  heapTotal: 0,
  heapUsed: 0
};

if (_suman.sumanConfig && _suman.sumanConfig.checkMemoryUsage) {

  setInterval(function () {

    const m = process.memoryUsage();
    if (m.heapTotal > maxMem.heapTotal) {
      maxMem.heapTotal = m.heapTotal;
    }
    if (m.heapUsed > maxMem.heapUsed) {
      maxMem.heapUsed = m.heapUsed;
    }

  }, 100);

}
