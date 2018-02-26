#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

Test.create(['parallel:true', function (assert, path, fs, it, $root, util) {

  const npmlinkconf = require('../../../../npm-link-up.json');

  npmlinkconf.list.forEach(item => {

    it.cb(`is symlink [${item}]`, t => {

      fs.lstat(path.resolve($root + '/node_modules/' + item), t.wrapFinalErrFirst(function (stats) {
        assert(stats.isSymbolicLink());
      }));

    });

  });

}]);
