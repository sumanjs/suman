const path = require('path');
const p = path.resolve(process.env.HOME + '/.suman/global/node_modules/sqlite3');

const dbPth = path.resolve(process.env.HOME + '/.suman/db');

var sqlite3 = require(p).verbose();

var db = new sqlite3.Database(dbPth, function (err) {
  if (err) console.error(err);
});

const commands = [
  'BEGIN TRANSACTION;',
  'SELECT id from suman_run_id;',
  'UPDATE suman_run_id SET run_id 3 WHERE id = 0;',
  'COMMIT TRANSACTION;'
].join('');

db.serialize(function () {

  // db.run('CREATE TABLE suman_run_id (id INTEGER UNIQUE, run_id INTEGER)', function (err) {
  //   if (err) console.error(err);
  // });

  var stmt = db.prepare('INSERT INTO suman_run_id VALUES (?,?)');
  stmt.run(0, 1);
  stmt.finalize();

  db.each('SELECT rowid AS rowid, id, run_id FROM suman_run_id', function (err, row) {
    console.log(row.rowid + ' | ' + row.id + ' | ' + row.run_id);
  });
});


