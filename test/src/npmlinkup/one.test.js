#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

Test.create(['parallel:true', function (assert, path, fs, it, $root, util) {

  const npmlinkconf = require('../../../npm-link-up.json');

  npmlinkconf.list.forEach(item => {

    it.cb('is symlink', t => {

      fs.stat(path.resolve($root + '/node_modules/' + item), t.wrapErrFirst(function (stats) {
        console.log(util.inspect(stats));
        assert(stats.isSymbolicLink());
      }));

    });

  });

}]);
