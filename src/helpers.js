var alphabet = 'abcdefghijklmnopqrstuvwxyz';

exports.tab = function (scope) {
	var level = scope.getLevel() + scope.getTemp();
	var out = '';
	for (var i = 0; i < level; i++) {
		out += '\t';
	}
	return out;
}

exports.writeBlock = function (scope, block, iterator, defaults) {
	iterator = iterator || function () {};
	defaults = defaults || [];

	var line, ending, out = '';
	var noSemiColon = ['if', 'for', 'while', 'try', 'switch'];
	var hasSemiNewline = /.*\;\n+$/;
	var hasSemi = /.*\;$/;
	for (var i in block) {
		if (typeof block[i] === 'object') {
			line = block[i].write(scope);
			// check that all lines end with a semicolon and a newline
			// if they don't, add it instead
			if (line === false) {
				continue;
			} else if (noSemiColon.indexOf(block[i].type) === -1) {
				// type requires semicolon
				if (hasSemiNewline.test(line)) {
					// has semicolon or semicolon and newline
					ending = '';
				} else if (hasSemi.test(line)) {
					ending = '\n';
				} else {
					ending = ';\n';
				}
			} else {
				ending = '\n';
			}

			out += exports.tab(scope) + line + ending;

			iterator(line, ending);
		}
	}

	return out;
}

exports.getNextIterator = function (scope, yy) {
	var arr, i, test = 'i';

	while (scope.exists('_' + test)) {
		// convert `test` into array of characters
		arr = test.split('');

		// convert characters to numbers and increment
		for (i = 0, l = arr.length; i < l; i++) {
			arr[i] = alphabet.indexOf(arr[i]) + 1;
			if (arr[i] > 25) {
				arr[i] = 0;
				if (i === 0) {
					arr.push(0);
				}
			} else {
				// no need to carry, so return
				break;
			}
		}

		for (i = 0, l = arr.length; i < l; i++) {
			arr[i] = alphabet[arr[i]];
		}

		test = arr.join('');
	}

	return new yy.Id('_' + test);
}

exports.getNextLength = function (scope, yy) {
	var num = 1,
		test = '_len';


	while (scope.exists(test)) {
		test = '_len' + (num + 1);
	}

	return new yy.Id(test);
}

exports.buildIterator = function (series, index, scope, yy) {
	var out = '';

	if (series instanceof[].constructor) {
		// series is range
		var first = series[0];
		var second = series[1];

		if (first.type === 'literal' && second.type === 'literal') {
			// both bounds are numbers
			var firstNum = Number(first.write(scope));
			var secondNum = Number(second.write(scope));

			var comparator = (firstNum <= secondNum) ? '<=' : '>=';
			var adjustment = (firstNum <= secondNum) ? '++' : '--';

			var i = index.write(scope); // eg: i (user submitted)
			var j = exports.getNextIterator(scope, yy); // eg: _j (program submitted)
			scope.useVar(j);
			j = j.write(scope);

			out = 'for (';
			out += i + ' = ' + j + ' = ' + first.write(scope) + '; ';
			out += j + ' ' + comparator + ' ' + second.write(scope) + '; ';
			out += j + ' = ' + i + adjustment + ') {\n';
		} else {
			// any of the bounds are variables
			// for (k = _i = foo; foo <= 10 ? _i <= 10 : _i >= 10; k = (foo <= 10 ? ++_i : --_i))
			first = first.write(scope);
			second = second.write(scope);

			var i = index.write(scope); // i
			var j = exports.getNextIterator(scope, yy); // _j
			scope.useVar(j);
			j = j.write(scope);

			out += 'for (';
			out += i + ' = ' + j + ' = ' + first + '; ';
			out += first + ' <= ' + second + ' ? ' + j + ' <= ' + second + ' : ' + j + ' >= ' + second + '; ';
			out += i + ' = ' + first + ' <= ' + second + ' ? ++' + j + ' : --' + j + ') {\n';
		}
	} else {
		// series is a single variable
		// for (_i = 0, _len = str.length; _i < _len; _i++)
		var i = index.write(scope); // user submitted
		var j = exports.getNextIterator(scope, yy); // program submitted
		scope.useVar(j);
		j = j.write(scope);

		var len = exports.getNextLength(scope, yy);
		scope.useVar(len);
		len = len.write(scope);

		out += 'for (';
		out += i + ' = ' + j + ' = 0, ' + len + ' = ' + series.write(scope) + '.length; ';
		out += j + ' < ' + len + '; ';
		out += i + ' = ++' + j + ') {\n';
	}

	return out;
}