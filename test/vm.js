

const vm = require('vm');
const fs = require('fs');

const sandBox = vm.createContext({foo:'bar'});
const file = fs.readFileSync(__dirname + '/regexp.js');
//
// vm.runInContext(file, sandBox);

let Module = require('module');
let fn = vm.runInContext(Module.wrap(file), sandBox);
fn(exports, require, module, __filename, __dirname);
console.log(module.exports);
