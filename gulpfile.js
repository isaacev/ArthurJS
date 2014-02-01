var Gulp = require('gulp');
var GulpUtil = require('gulp-util');
var GulpArthur = require('gulp-arthur');
var GulpValidate = require('gulp-jsvalidate');
var Build = require('./build.js').build;


// takes each *.arthur file in `/arthur/` and compiles
// it to JavaScript, placing the output data inside
// `/bin/modules/` directory
Gulp.task('arthur', function () {
	Gulp.src('./arthur/*.arthur')
		.pipe(GulpArthur({
			bare: true,
			basic: true
		}).on('error', GulpUtil.log))
		.pipe(Gulp.dest('./bin/modules/'));
});


// ensure that the JavaScript output by the parser
// is valid before packaging into `arthur.js` else
// the entire process becomes corrupted. no new files
// can be written because the parser is corrupt making
// it impossible to correct the mistake
Gulp.task('validate', function () {
	Gulp.src('./bin/modules/*.js')
		.pipe(GulpValidate());
});


// runs `build.js` which concatenates all raw JavaScript
// source files, wrapping them in a sercret sauce that
// allows them to run in Node.js or client-side seamlessly
Gulp.task('build', function () {
	Build(false);
});


// different than `build`, `original` uses the previously generated
// JavaScript files to creat the parser. this is in case the latest
// files get malformed and therefore the parser becomes malformed
// making it impossible to correct the files
Gulp.task('original', function () {
	Build(true);
});


// watches *.arthur files for changes
// when detected, compiles the new file and
// builds full `arthur.js`
Gulp.task('watch', function () {
	Gulp.watch('./arthur/*.arthur', ['arthur', 'validate', 'build']);
});


// the default task
// builds all the *.arthur files in the arthur directory,
// saving them into the modules folder. when completed,
// it validates their JavaScript, checking for malformed
// code. if the tests pass, it builds them all into a new
// Arthur compiler
Gulp.task('default', ['arthur', 'validate', 'build']);