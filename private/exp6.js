const path = require('path');

const p1 = path.normalize('/test/a/b/c/');
const p2 = path.normalize('/test/a/b/c');

console.log(p1, p2);