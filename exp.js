/**
 * Created by Olegzandr on 5/14/16.
 */

const fs = require('fs');

const strm = fs.createWriteStream('a.log');

process.stdin.pipe(strm);

