#!/usr/bin/env node

var Fs = require('fs');
var Vm = require('vm');
var Arthur = require('../bin/arthur.js');

var tasks = {};

function task (name, desc, func) {
	tasks[name] = {
		desc: desc,
		exec: func
	};
};

function run (name, args) {
	if (args === undefined) {
		args = {};
	}

	if (tasks[name]) {
		tasks[name].exec(args);
	} else {
		return 'No task: ' + name;
	}
};

function printTasks() {
	var name, str = '                              ';

	console.log('Feastfile describes these tasks:\n');
	for (var i in tasks) {
		name = 'feast ' + i;
		console.log(name + str.substr(name.length, str.length) + '# ' + tasks[i].desc);
	}
}

var args = process.argv.slice(2);

Fs.readFile('./Feastfile', 'utf8', function (err, data) {
	if (err) {
		throw err;
	} else {
		var sandbox = Vm.Script.createContext(global);
		sandbox.require = require;
		sandbox.global = global;
		sandbox.task = task;

		Arthur.run(data, {
			sandbox: sandbox
		});

		if (args.length === 0) {
			printTasks();
		} else {
			run(args[0]);
		}
	}
});
