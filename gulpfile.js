var Gulp = require('gulp');
var GulpUtil = require('gulp-util');
var GulpArthur = require('gulp-arthur');
var GulpValidate = require('gulp-jsvalidate');
var Build = require('./build.js').build;


// takes each *.arthur file in `/arthur/` and compiles
// it to JavaScript, placing the output data inside
// `/bin/modules/` directory
Gulp.task('arthur', function () {
	// Gulp.src('./arthur/*.arthur')
	// 	.pipe(GulpArthur({
	// 		bare: true
	// 	}).on('error', GulpUtil.log))
	// 	.pipe(Gulp.dest('./bin/modules/'));
	Gulp.src('./arthur/*.arthur')
		.pipe(GulpArthur({
			bare: true
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
	Build();
});


// watches *.arthur files for changes
// when detected, compiles the new file and
// builds full `arthur.js`
Gulp.task('watch', function () {
	Gulp.watch('./src/**', ['arthur', 'validate', 'build']);
});

Gulp.task('default', ['arthur', 'validate', 'build']);