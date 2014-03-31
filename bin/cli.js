// Written by Arthur v1.0.0
(function() {
	var Arthur, Cli, Fs, Path, Repl, Vm, args, loadFile, saveFile, buildFileName, walkArthurFiles, sandbox, compile;
	Arthur = require('./bin/arthur.js');
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
	Cli.option('-r --repl', 'open REPL (read, evaluate, print loop)');
	Cli.parse(process.argv);
	args = {};
	if (Cli.args.length === 0 || Cli.repl) {
		args.repl = true;
	} else {
		args.repl = false;
	}

	args.src = Cli.args[0] || Cli.compile || false;
	args.dest = Cli.args[1] || Cli.destination || false;
	args.print = Cli.print || false;
	args.bare = Cli.bare || false;
	args.help = Cli.help || false;
	args.version = Cli.version || false;
	loadFile = function (path, callback) {
		var process;

		process = function (err, data) {
			if (err === true) {
				throw err.toString();
			} else {
				callback(data);
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
		Fs.writeFile(path, data, process);
	};
	buildFileName = function (path) {
		var file;

		file = Path.basename(path);
		return file.substr(0, file.length - Path.extname(path).length) + '.js';
	};
	walkArthurFiles = function (dir, callback) {
		var results;

		results = [];
		Fs.readdir(dir, function (err, list) {
			var pending;

			if (err === true) {
				return callback(err);
			} else {
				pending = list.length;
				if (pending === 0) {
					return callback(null, results);
				} else {
					list.forEach(, function (file) {
						file = dir + '/' + file;
						Fs.stat(file, function (err, stat) {
							if (stat && stat.isDirectory()) {
								walkArthurFiles(file, function (err, res) {
									results = results.concat(res);
									if (pending-- === 0) {
										callback(null, results);
									}
								});
							} else {
								if (/.*\.arthur/.test(file) === true) {
									results.push(file);
								}
								if (pending-- === 0) {
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
		} else if (args.src === true) {
			compile = function (code) {
				var js;

				console.time('compilation');
				js = Arthur.parse(code + '\n', {
					bare: args.bare,
					header: false
				});
				console.timeEnd('compilation');
				if (args.dest !== false) {
					saveFile(args.dest, js);
					if (args.print === true) {
						console.log(js);
					}
				} else {
					console.log(js);
				}

			};
			loadFile(args.src, compile);
		} else {
			console.log('Whoops! no source file given');
		}

	} catch (err) {
		console.log(err.toString());
	}
}).call(this);