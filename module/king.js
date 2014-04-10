#!/usr/bin/env node

var Fs = require('fs');
var Vm = require('vm');
var Arthur = require('../lib/arthur.js');

var decrees = {};

function decree(name, desc, func) {
	decrees[name] = {
		desc: desc,
		exec: func
	};
};

function run(name, args) {
	if (args === undefined) {
		args = {};
	}

	if (decrees[name]) {
		decrees[name].exec(args);
	} else {
		return 'No decree: ' + name;
	}
};

function printDecrees() {
	var name, str = '                              ';

	console.log('Kingdom file describes these decrees:\n');
	for (var i in decrees) {
		name = 'king ' + i;
		console.log(name + str.substr(name.length, str.length) + '# ' + decrees[i].desc);
	}
}

var args = process.argv.slice(2);

Fs.readFile('./Kingdom', 'utf8', function (err, data) {
	if (err) {
		throw err;
	} else {
		var sandbox = Vm.Script.createContext(global);
		sandbox.require = require;
		sandbox.global = global;
		sandbox.decree = decree;

		try {
			Arthur.run(data, {
				sandbox: sandbox
			});
		} catch (err) {
			console.log(err.toString());
		}

		if (args.length === 0) {
			printDecrees();
		} else {
			run(args[0], args.splice(1));
		}
	}
});
