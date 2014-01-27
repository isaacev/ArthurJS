'use strict';

var Arthur = require('./bin/arthur.js');
var Cli = require('commander');
var Fs = require('fs');
var Path = require('path');

Cli
	.version(Arthur.VERSION)
	.usage('[src file] [destination file] [options]')
	.option('<src> <dest>', 'default option, alias for --compile')
	.option('-c --compile <src>', 'compiles to JavaScript and save as local *.js file')
	.option('-d --destination <dest>', 'saves compiled file to destination')
	.option('-p --print', 'print compiled code to terminal')
	.option('-b --bare', 'remove global function wrapper')
	.parse(process.argv);

var args = {};
args.src = Cli.args[0] || Cli.compile || false;
args.dest = Cli.args[1] || Cli.destination || false;
args.print = Cli.print || false;
args.bare = Cli.bare || false;
args.help = Cli.help || false;
args.version = Cli.version || false;

try {
	if (args.src) {
		loadFile(args.src, function (code) {
			console.time('compilation');
			var js = Arthur.parse(code + '\n', {
				bare: args.bare,
				header: true
			});
			console.timeEnd('compilation');

			// determine what to do with compiled JavaScript
			if (args.dest !== false) {
				// a destination has been specified
				Fs.exists(args.dest, function (exists) {
					if (exists === true) {
						// destination EXISTS
						saveFile(args.dest, js);
					} else {
						// destination EMPTY
						saveFile(args.dest, js);
					}
				});

				if (args.print) {
					console.log(js);
				}
			} else {
				console.log(js);
			}
		})
	}
} catch (err) {
	console.log(err.toString);
}

// utility function for loading files
function loadFile(path, callback) {
	callback = callback || function () {};

	Fs.readFile(path, 'utf8', function (err, data) {
		if (err) {
			throw err.toString();
		} else {
			callback(data);
		}
	});
}

// utility function for saving files
function saveFile(path, data) {
	Fs.writeFile(path, data, function (err) {
		if (err) {
			throw Error('problem saving to ' + path);
		} else {
			console.log(path, ' successfully saved');
		}
	});
}