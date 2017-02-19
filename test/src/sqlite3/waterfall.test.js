const path = require('path');
const p = path.resolve(process.env.HOME + '/.suman/global/node_modules/sqlite3');

const dbPth = path.resolve(process.env.HOME + '/.suman/db');

var sql = require(p).verbose();

var db = new sql.Database(dbPth,
  function (err) {
    if (err) console.error(err);
  });

db.configure('busyTimeout', 9000);

const async = require('async');

function helper (fn) {
  return fn;
}

function shot(){

  async.waterfall([
    db.run.bind(db,'BEGIN TRANSACTION;'),
    db.all.bind(db,'SELECT run_id from suman_run_id'),
    function(rows,cb){
      console.log('rows length => ', rows.length, rows);
      db.run('UPDATE suman_run_id SET run_id = ' + (rows[0].run_id + 1) + ';', cb);
    },
    db.run.bind(db,'COMMIT TRANSACTION;')

  ], function (err) {
     if(err){
       console.error(err.stack || err);
     }
     else{
       shot();
     }
  });

}

shot();




