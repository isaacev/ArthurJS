// Written by Arthur v1.0.0
(function() {
	var Fs, Vm, Arthur, tasks, args, task, run, printTasks;
	Fs = require('fs');
	Vm = require('vm');
	Arthur = require('../bin/arthur.js');
	tasks = {};
	args = process.argv.slice(2);
	task = function (name, desc, func) {
		tasks[name] = {
			desc: desc,
			exec: func
		};
	};
	run = function (name, args) {
		if (args === undefined || args === null) {
			args = {};
		}

		if ((typeof tasks[name] !== 'undefined' && tasks[name] !== null)) {
			tasks[name].exec(args);
		} else {
			return 'No task: ' + name;
		}

	};
	printTasks = function () {
		var str, i, _i, _len, name;

		str = '                              ';
		console.log('Kingdom file describes these tasks:\n');
		for (i = _i = 0, _len = tasks.length; _i < _len; i = ++_i) {
			task = tasks[i];
			name = 'king ' + i;
			console.log(name + str.substr(name.length, str.length) + '# ' + task.desc);
		}
	};
	Fs.readFile('./Kingdom', 'utf8', function (err, data) {
		var sandbox;

		if (err !== null) {
			throw err;
		} else {
			sandbox = Vm.Script.createContext(global);
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
}).call(this);