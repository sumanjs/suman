/**
 * Created by amills001c on 12/9/15.
 */



//you should be able to run your tests with gulp, instead of npm run blah

var babel = require('gulp-babel'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    del = require('del');


gulp.task('clean-temp', function () {
    return del(['dest']);
});

gulp.task('es6-commonjs', ['clean-temp'], function () {
    return gulp.src(['app/*.js', 'app/**/*.js'])
        .pipe(babel())
        .pipe(gulp.dest('dest/temp'));
});