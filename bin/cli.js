// Written by Arthur v1.0.0
(function() {
	var Arthur, Cli, Fs, Path, Repl, Vm, args;
	Arthur = require('./main.js');
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
	args.repl = Cli.repl || false;
	args.src = Cli.args[0] || Cli.compile || false;
}).call(this);