var Colors = require('colors');

function printStatus(name, failures) {
	var name, str = '                              ';

	if (failures.length === 0) {
		console.log('  ' + name + str.substr(name.length + 2, str.length) + 'passed'.green);
	} else {
		console.log('  ' + name.bold + str.substr(name.length + 2, str.length) + 'failed'.magenta);
		for (var i = 0, len = failures.length; i < len; i++) {
			console.log('    ' + failures[i].bold + str.substr(failures[i].length + 4, str.length) + 'failed'.magenta);
		}
	}
}

module.exports = function (basePath) {
	var Arthur = require(basePath + 'main.js');

	function describe(name, func) {
		var successes = 0;
		var failures = [];

		func(function (name, expected, test) {
			try {
				var js = Arthur.parse(test, { bare: true, header: false });

				if (expected === eval(js)) { // EVAL IS EVIL, right?
					successes++;
				} else {
					failures.push(name);
				}
			} catch (err) {
				console.log(err);
				failures.push(name);
			}
		});

		printStatus(name, failures);
	}

	// test basics
	require('./tests.js').test(describe);
};
