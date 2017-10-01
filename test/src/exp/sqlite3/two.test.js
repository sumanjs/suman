const path = require('path');
const p = path.resolve(process.env.HOME + '/.suman/global/node_modules/sqlite3');

const dbPth = path.resolve(process.env.HOME + '/.suman/db');

var sqlite3 = require(p).verbose();

var db = new sqlite3.Database(dbPth,
  function (err) {
    if (err) console.error(err);
  });

db.configure('busyTimeout', 9000);

const async = require('async');

async.forever(function (cb) {

  db.serialize(function () {
    db.run('BEGIN TRANSACTION;');
    db.each('SELECT run_id from suman_run_id', function (err, row) {
      db.serialize(function () {
        console.log('row => ', row);
        const val = row.run_id + 1;
        console.log('val => ', val);
        db.run('UPDATE suman_run_id SET run_id = ' + val);
        db.run('COMMIT TRANSACTION;', function (err) {
          setTimeout(cb, 100);
        });
      });
    });
  });

}, function (err) {
  console.error(err.stack || err);
});




