const util = require('util');
const gulp = module.exports = require('gulp');

const two = () => Promise.resolve(11);

const one = gulp.series(two, () => Promise.resolve(5));

gulp.task('one', one);
gulp.task('two', two);



const prelim = gulp.task('one');
const result = prelim();

console.log(util.inspect(prelim));
console.log(util.inspect(result));