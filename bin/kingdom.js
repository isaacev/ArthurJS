// Written by Arthur v1.0.0
(function() {
	var Fs, Vm, Colors, Arthur, decree, run, printDecrees, args;
	Fs = require('fs');
	Vm = require('vm');
	Colors = require('colors');
	Arthur = require('../lib/arthur.js');
	decree = {};
	decree = function (name, desc, func) {
		decrees[name] = {
			desc: desc,
			exec: exec
		};
	};
	run = function (name, args) {
		if (args === undefined || args === null) {
			args = [];
		}

		if ((typeof decrees[name] !== 'undefined' && decrees[name] !== null)) {
			decrees[name].exec(args);
		} else {
			return 'No decree: ' + name;
		}

	};
	printDecrees = function () {
		var str, i, _i, _len, name;

		str = '                                ';
		console.log('\nKingdom file describes these decrees:');
		for (i = _i = 0, _len = decrees.length; _i < _len; i = ++_i) {
			decree = decrees[i];
			name = '  king ' + i.green;
			console.log(name + str.substr(name.length, str.length) + '# ' + decree.desc);
		}
		console.log('');
	};
	args = process.argv.slice(2);
	Fs.readFile('./Kingdom', 'utf8', function (err, data) {
		var sandbox;

		if (err !== null) {
			throw err;
		} else {
			sandbox = Vm.Script.createContext(global);
			sandbox.require = require;
			sandbox.global = global;
			sandbox.decree = decree;
			sandbox.run = run;
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
}).call(this);