#!/usr/bin/env node

var Arthur, Cli, Fs, Path, Repl, Vm, args, sandbox, compile, loadFile, saveFile;

Arthur = require('../bin/main.js');
if (!Arthur.VERSION) {
	Arthur = require('../lib/arthur.js');
}

Cli = require('commander');
Fs = require('fs');
Path = require('path');
Repl = require('repl');
Vm = require('vm');
Cli.version('Arthur version: ' + Arthur.VERSION);
Cli.usage('[src file] [destination file] [options]');
Cli.option('<src> <dest>', 'default option, alias for --compile');
Cli.option('-c --compile <src>', 'compiles to JavaScript and save as local *.js file');
Cli.option('-d --destination <dest>', 'saves compiled file to destination');
Cli.option('-p --print', 'print compiled code to terminal');
Cli.option('-b --bare', 'remove global function wrapper');
Cli.option('-r --run', 'execute compiled JavaScript');
Cli.option('-l --log', 'log each file compilation and flag errors');

Cli.parse(process.argv);

args = {};

args.repl = false;
args.src = Cli.args[0] || Cli.compile || false;
args.dest = Cli.args[1] || Cli.destination || false;
args.print = Cli.print || false;
args.bare = Cli.bare || false;
args.run = Cli.run || false;
args.log = Cli.log || false;
args.help = Cli.help || false;
args.version = Cli.version || false;


loadFile = function (path, callback) {
	var process;

	process = function (err, data) {
		if (err === true) {
			throw err.toString();
		} else {
			callback(path, data);
		}

	};
	Fs.readFile(path, 'utf8', process);
};

saveFile = function (path, data) {
	var process;

	process = function (err) {
		if (err === true) {
			throw Error('problem saving to ' + path);
		} else {
			console.log(path, 'successfully saved');
		}

	};
	Fs.writeFile(path, '// Written by Arthur v' + Arthur.VERSION + '\n' + data, process);
};

buildFileName = function (path) {
	var file = Path.basename(path);
	return file.substr(0, file.length - Path.extname(path).length) + '.js';
};

walkArthurFiles = function (dir, callback) {
	var pending, results = [];

	Fs.readdir(dir, function (err, list) {
		if (err) {
			return callback(err)
		} else {
			pending = list.length;
			if (!pending) {
				return callback(null, results);
			} else {
				list.forEach(function (file) {
					file = dir + '/' + file;
					Fs.stat(file, function (err, stat) {
						if (stat && stat.isDirectory()) {
							walkArthurFiles(file, function (err, res) {
								results = results.concat(res);
								if (!--pending) {
									callback(null, results);
								}
							})
						} else {
							if (/.*\.arthur/.test(file) === true) {
								results.push(file);
							}

							if (!--pending) {
								callback(null, results);
							}
						}
					});
				});
			}
		}
	});
};

try {
	if (args.repl === true) {
		sandbox = Vm.createContext({});
		Repl.start({
			prompt: '-> ',
			eval: function (cmd, ctx, name, callback) {
				var code;

				try {
					code = Arthur.parse(cmd.substring(1, cmd.length - 2), {
						bare: true
					});
					callback(null, Vm.runInContext(code, sandbox));
				} catch (err) {
					console.log(err);
				}
			}
		});
	} else if (args.src !== false && Fs.lstatSync(args.src).isFile()) {
		// args.src exists and it is a FILE
		compile = function (path, code) {
			var js;

			js = Arthur.parse(code, {
				bare: args.bare,
				header: false
			});

			if (args.dest !== false) {
				saveFile(args.dest, js);
				if (args.print == true) {
					console.log(js);
				}
			} else {
				if (args.run === true) {
					Arthur.run(code);
				} else {
					console.log(js);
				}
			}

		};
		loadFile(args.src, compile);
	} else if (args.src !== false && Fs.lstatSync(args.src).isDirectory()) {
		// args.src exists and it is a DIRECTORY
		compile = function (path, code) {
			var js;

			try {
				js = Arthur.parse(code, {
					bare: args.bare,
					header: false
				});
			} catch (err) {
				console.log('problem compiling', path);
				console.log(err);
			}

			if (args.dest !== false && js != undefined) {
				saveFile(args.dest + '/' + buildFileName(path), js);
			} else {
				console.log('successfully validated', path);
			}
		};

		walkArthurFiles(args.src, function (err, results) {
			for (var i = 0, len = results.length; i < len; i++) {
				loadFile(results[i], compile);
			}
		});
	} else {
		console.log('Whoops! no source file given');
	}
} catch (err) {
	console.log(err.toString());
}
