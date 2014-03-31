// Written by Arthur v1.0.0
(function() {
	var alphabet;
	alphabet = 'abcdefghijklmnopqrstuvwxyz';
	exports.tab = function (scope) {
		var level, out;

		level = scope.getLevel() + scope.getTemp();
		out = '';
		while (0 < level) {
			out = out + '\t';
			level--;
		}
		return out;
	};
	exports.writeBlock = function (scope, block, iterator, defaults) {
		var out, noSemiColon, hasSemiNewline, hasSemi, i, line, _i, _len, str, ending;

		if (defaults === undefined || defaults === null) {
			defaults = [];
		}

		out = '';
		noSemiColon = [
			'if',
			'for',
			'while',
			'try',
			'switch',
			'comment'
		];
		hasSemiNewline = /.*\;\n+$/;
		hasSemi = /.*\;$/;
		for (i = _i = 0, _len = block.length; _i < _len; i = ++_i) {
			line = block[i];
			if (line.type !== 'comment') {
				if ((typeof line === 'object') && line.type) {
					str = line.write(scope);
					if (noSemiColon.indexOf(line.type) === -1) {
						if (hasSemiNewline.test(str) === true) {
							ending = '';
						} else if (hasSemi.test(str) === true) {
							ending = '\n';
						} else {
							ending = ';\n';
						}

					} else {
						ending = '\n';
					}

				}
				out = out + exports.tab(scope) + str + ending;
				if ((typeof iterator !== 'undefined' && iterator !== null)) {
					iterator(str, ending);
				}
			}
		}
		return out;
	};
	exports.getNextIterator = function (scope, yy) {
		var test, arr, i, _i, _len, _, _len2;

		test = 'i';
		while (scope.exists('_' + test) === true) {
			arr = test.split('');
			for (i = _i = 0, _len = arr.length; _i < _len; i = ++_i) {
				arr[i] = alphabet.indexOf(arr[i] + 1);
				if (arr[i] > 25) {
					arr[i] = 0;
					if (i === 0) {
						arr.push(0);
					}
				} else {
					break;
				}

			}
			for (i = _ = 0, _len2 = arr.length; _ < _len2; i = ++_) {
				arr[i] = alphabet[arr[i]];
			}
			test = arr.join('');
		}
		return new yy.Id('_' + test);
	};
	exports.getNextLength = function (scope, yy) {
		var num, test;

		num = 1;
		test = '_len';
		while (scope.exists(test) === true) {
			test = '_len' + (num + 1);
		}
		return new yy.Id(test);
	};
	exports.buildIterator = function (series, index, scope, yy) {
		var out, first, second, firstNum, secondNum, comparator, adjustment, i, j, len;

		out = '';
		if ((series instanceof Array)) {
			first = series[0];
			second = series[1];
			if (first.type === 'literal' && second.type === 'literal') {
				firstNum = Number(first.write(scope));
				secondNum = Number(second.write(scope));
				if (firstNum <= secondNum) {
					comparator = '<=';
					adjustment = '++';
				} else {
					comparator = '>=';
					adjustment = '--';
				}

				i = index.write(scope);
				j = exports.getNextIterator(scope, yy);
				scope.useVar(j);
				j = j.write(scope);
				out = 'for (';
				out = out + i + ' = ' + j + ' = ' + first.write(scope) + '; ';
				out = out + j + ' ' + comparator + ' ' + second.write(scope) + '; ';
				out = out + j + ' = ' + i + adjustment + ') {\n';
			} else {
				first = first.write(scope);
				second = second.write(scope);
				i = index.write(scope);
				j = exports.getNextIterator(scope, yy);
				scope.useVar(j);
				j = j.write(scope);
				out = out + 'for (';
				out = out + i + ' = ' + j + ' = ' + first + '; ';
				out = out + first + ' <= ' + second + ' ? ' + j + ' <= ' + second + ' : ' + j + ' >= ' + second + '; ';
				out = out + i + ' = ' + first + ' <= ' + second + ' ? ++' + j + ' : --' + j + ') {\n';
			}

		} else {
			i = index.write(scope);
			j = exports.getNextIterator(scope, yy);
			scope.useVar(j);
			j = j.write(scope);
			len = exports.getNextLength(scope, yy);
			scope.useVar(len);
			len = len.write(scope);
			out = out + 'for (';
			out = out + i + ' = ' + j + ' = 0, ' + len + ' = ' + series.write(scope) + '.length; ';
			out = out + j + ' < ' + len + '; ';
			out = out + i + ' = ++' + j + ') {\n';
		}

		return out;
	};
}).call(this);