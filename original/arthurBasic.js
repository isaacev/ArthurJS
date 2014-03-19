var Arthur = (function(){var exports = {};function require(path) {switch(path) {case './helpers.js':return exports;break;case './scope.js':return exports;break;}}var helpers = (function(exports, require) {var alphabet = 'abcdefghijklmnopqrstuvwxyz';

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
				// no need to carry, so break loop
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
})(exports, require);var scope = (function(exports, require) {exports.Scope = function () {
	var scope = [];
	var temp = 0;
	var extensions = {};

	this.printLocal = function () {
		var local = scope[scope.length - 1].vars;

		if (local.length) {
			var out = 'var ';
			for (var i in local) {
				if (i > 0) {
					out += ', ';
				}

				if (typeof local[i] === 'object') {
					out += local[i][0] + ' = ' + local[i][1];
				} else {
					out += local[i];
				}
			}
			return out;
		} else {
			return '';
		}
	};

	this.useVar = function (identifier) {
		if (typeof identifier !== 'string') {
			identifier = identifier.write(scope);
		}

		for (var i in scope) {
			if (scope[i].vars.indexOf(identifier) !== -1) {
				return;
			} else if (scope[i].scope.indexOf(identifier) !== -1) {
				return;
			}
		}

		this.declareVar(identifier);
	};

	this.declareVar = function (identifier, hidden) {
		if (typeof identifier !== 'string') {
			identifier = identifier.write(scope);
		}

		if (hidden === true) {
			scope[scope.length - 1].scope.push(identifier);
		} else {
			scope[scope.length - 1].vars.push(identifier);
		}
	};

	this.use = function (string, alias) {
		alias = alias || false;

		var last = scope[scope.length - 1].uses;

		for (var i in last) {
			// check if global has already been used
			if (last[i][0] === string) {
				return;
			}
		}

		last.push([string, alias]);
	};

	this.printUses = function (aliases) {
		aliases = aliases || false;

		var last = scope[scope.length - 1].uses;

		var out = '';
		if (last.length) {
			for (var i in last) {
				if (i > 0) {
					out += ', ';
				}

				if (aliases && last[i][1]) {
					out += last[i][1];
				} else {
					out += last[i][0];
				}
			}

			if (!aliases) {
				out = ', [' + out + ']';
			}
		} else {
			out = '';
		}

		return out;
	};

	this.exists = function (identifier) {
		if (typeof identifier !== 'string') {
			identifier = identifier.write(scope);
		}

		for (var i = scope.length - 1; i >= 0; i--) {
			if (scope[i].vars.indexOf(identifier) !== -1) {
				return true;
			}
		}

		return false;
	};

	this.appendHelper = function (name) {
		if (Helpers[name]) {
			var helper = Helpers[name];

			scope[0].vars.push([
				'_' + name,
				helper.func
			]);

			if (helper.dependencies.length > 0) {
				for (var i in helper.dependencies) {
					this.appendHelper(helper.dependencies[i]);
				}
			}
		}
	};

	this.isInClass = function () {
		for (var i in scope) {
			if (scope[i].class !== false) {
				return scope[i].class;
			}
		}
		return false;
	};

	this.indent = function (opts) {
		opts = opts || {};

		scope.push({
			vars: [],
			scope: []
		});
	};

	this.dedent = function () {
		scope.pop();
	};

	this.indentTemp = function () {
		temp++;
	};

	this.dedentTemp = function () {
		temp--;
	};

	this.getTemp = function () {
		return temp;
	};

	this.getLevel = function () {
		return scope.length;
	};
}
})(exports, require);var lexer = (function(exports, require) {'use strict';

var indent = [0];
var pos = {
	col: 0,
	row: 0
}

var rules = {
	space: [
		/^ +/,
		function (raw) {
			pos.col += raw.length;
			return false;
		}
	],
	terminator: [
		/^\n+/,
		function (raw, lex, modify, increment) {
			pos.col = 0;
			pos.row += raw.length;

			var indentation = /^\t*/.exec(lex.remaining.substr(raw.length))[0].length;
			increment(indentation);

			pos.col += indentation;

			var tokens = ['TERMINATOR'];

			if (indentation > indent[0]) {
				// indentation level increased
				indent.unshift(indentation);
				tokens.push('IND');
			} else if (indentation < indent[0]) {
				// indentation level decreased
				while (indentation < indent[0]) {
					tokens.push('DED');
					tokens.push('TERMINATOR');
					indent.shift();
				}
			}

			return tokens;
		}
	],
	comment: [
		/^\#[^\n]*/,
		function (raw) {
			pos.col += raw.length;
			return 'COMMENT';
		}
	],
	identifier: [
		/^[a-zA-Z\$\_][a-zA-Z0-9\$\_]*/,
		function (raw, lex, modify) {
			pos.col += raw.length;

			if (RESERVED_AR.indexOf(raw) > -1 || RESERVED_JS.indexOf(raw) > -1) {
				// reserved ARTHUR or JS word

				// this bit of code is really what this entire custom lexer is
				// about. to solve the problem of the "dangling else" I needed a
				// lexer that would remove the ambiguous TERMINATOR that occured
				// between IF blocks and ELSE blocks. I needed to build my own because
				// Lex.js didn't offer the granular support I required. anyway,
				// enough rambling: here it is, stupid thing
				var removedPrevTerminator = ['else', 'elseif', 'catch', 'finally'];
				if ((removedPrevTerminator.indexOf(raw) !== -1) && lex.tokens[lex.tokens.length - 1] === 'TERMINATOR') {
					lex.tokens.pop();
					lex.literals.pop();
				}

				if (raw === 'typeof') {
					if (lex.tokens[lex.tokens.length - 1] === '!') {
						lex.tokens.pop();
						lex.literals.pop();
						modify('!typeof');
					}
					return 'LOGIC';
				} else if (raw === 'instanceof') {
					if (lex.tokens[lex.tokens.length - 1] === '!') {
						lex.tokens.pop();
						lex.literals.pop();
						modify('!instanceof');
					}
					return 'LOGIC';
				}

				return raw.toUpperCase();
			} else {
				return 'IDENTIFIER';
			}
		}
	],
	logicSymbol: [
		/^\>\=|^\<\=|^\=\=|^\!\=|^\&\&|^\|\||^\>|^\</,
		function (raw) {
			pos.col += raw.length;

			return 'LOGIC';
		}
	],
	literalSymbol: [
		/^\+\+|^\+|^\-\-|^\.\.|^\.|^\-|^\/|^\*\*|^\*|^\,|^\(|^\)|^\[|^\]|^\{|^\}|^\=|^\:|^\?|^\@|^\!/,
		function (raw) {
			pos.col += raw.length;

			if (['+', '-', '*', '/', '**'].indexOf(raw) > -1) {
				return 'MATH';
			} else {
				return raw;
			}
		}
	],
	string: [
		/^\'(?:[^\'\\]|\\.)*\'/,
		function (raw, lex, modify) {
			pos.col += raw.length;

			// remove quotes from string
			modify(raw.substr(1).substr(0, raw.length - 2));

			return 'STRING';
		}
	],
	number: [
		/^\-?[0-9]+(?:\.[0-9]+)?/,
		function (raw) {
			pos.col += raw.length;

			return 'NUMBER';
		}
	],
	regex: [
		/^\/(?:[^\/\\]|\\.)+\//,
		function (raw) {
			pos.col += raw.length;

			return 'REGEX';
		}
	],
	unexpected: [
		/^./,
		function (raw, lex) {
			throw Error('Unexpected "' + raw + '" at line ' + (pos.row + 1) + ', column ' + (pos.col + 1));
		}
	]
};

var WHITESPACE = ['TERMINATOR', 'IND', 'DED'];
var RESERVED_AR = ['def', 'as', 'elseif'];
var RESERVED_JS = ['true', 'false', 'null', 'if', 'else', 'return', 'for', 'while', 'in', 'typeof', 'instanceof', 'break', 'throw', 'new', 'try', 'catch', 'finally'];

// `check` inspects a specific rule to see if it matches
// the remainder of the string. if the rule does, `check`
// returns the number of 
function check(lex, rule) {
	var match = rule[0].exec(lex.remaining);
	if (match !== null) {
		// advance the index
		var advancement = match[0].length;

		var result = rule[1](match[0], lex, function (modification) {
			match[0] = modification;
		}, function (increment) {
			advancement += increment;
		});
		if (result !== false) {
			if (result instanceof Array) {
				// multiple tokens returned
				for (var i = 0, len = result.length; i < len; i++) {
					lex.literals.push(false);
					lex.tokens.push(result[i]);
				}
			} else {
				if (WHITESPACE.indexOf(result) > -1) {
					lex.literals.push(false);
				} else {
					lex.literals.push(match[0]);
				}
				lex.tokens.push(result);
			}
		}
		return advancement;
	} else {
		return false;
	}
}

function Lexer() {
	this.tokens = [];
	this.literals = [];
	this.remaining;
	this.index = 0;
	this.setInput = function (input) {
		this.input = input;
		this.remaining = input;
	};
	this.lex = function () {
		while (this.remaining.length > 0) {
			// `check` returns `number` or `false`
			// if nothing recognizes the symbol, it gets passed
			// to a catch-all `unexpected` which throws an exception
			this.index += check(this, rules.space) ||
				check(this, rules.terminator) ||
				check(this, rules.string) ||
				check(this, rules.number) ||
				check(this, rules.regex) ||
				check(this, rules.comment) ||
				check(this, rules.identifier) ||
				check(this, rules.logicSymbol) ||
				check(this, rules.literalSymbol) ||
				check(this, rules.unexpected);

			this.remaining = this.input.substr(this.index);
		}

		return {
			tokens: this.tokens,
			literals: this.literals
		};
	};
}

// this chunk wraps the above code into an interface
// compatible with Jison. when `setInput` is called,
// the lexer tokenizes the ENTIRE string, modifying
// the stream as required. the stream is then fed token
// by token back to Jison as needed
exports.lexer = function () {
	var scanner = new Lexer();
	var tokens, literals;
	var i = -1;
	this.setInput = function (input, returnQuick) {
		scanner.setInput(input);
		var results = scanner.lex();
		tokens = results.tokens;
		literals = results.literals;
		if (returnQuick === true) {
			console.log(tokens);
			return;
		}
		return this;
	};

	this.lex = function () {
		i++;
		if (literals[i] !== false) {
			this.yytext = literals[i];
		}
		return tokens[i];
	};
};
})(exports, require);var yy = (function(exports, require) {'use strict';

var Helpers = require('./helpers.js');
var Scope = require('./scope.js').Scope;

// these are helper functions imported from helpers.js
// they provide utility services like generating the
// correct number of tab characters, looping through
// and printing chunks of the parser tree and making
// sure custom looping variables (ex: _i, _len) are
// unique within their contexts
var tab = Helpers.tab;
var writeBlock = Helpers.writeBlock;
var buildIterator = Helpers.buildIterator;

exports.yy = {
	// the Root object is returned after parsing actions to a
	// callback. this object builds a Scope instance, inspects
	// parsing options like `header` and `bare` and formats
	// the returning JavaScript accordingly
	Root: function (lines) {
		this.type = 'root';
		this.compile = function (opts) {
			opts = opts || {};

			var out = '';

			var scope = new Scope();

			scope.indent();
			if (opts.bare === true) {
				scope.dedentTemp();
			}

			out += writeBlock(scope, lines);

			var variables = scope.printLocal();
			if (variables.length) {
				variables = tab(scope) + variables + ';\n';
			} else {
				variables = '';
			}

			if (opts.bare === true) {
				scope.indentTemp();
			}

			scope.dedent();

			// optionally wrap file in function wrapper and remove unnecessary newlines from end
			if (opts.bare !== true) {
				out = '(function() {\n' + variables + out.replace(/\s+$/, '\n') + tab(scope) + '}).call(this);';
			} else {
				out = variables + '\n' + out.replace(/\s+$/, '');
			}

			// add optional header
			if (opts.header === true) {
				out = '// Written by Arthur v0.1.0\n\n' + out;
			}

			return out;
		};
	},

	Assignment: function (identifier, value) {
		this.type = 'assignment';
		this.write = function (scope) {
			if (identifier.write(scope).split('.').length === 1 && identifier.type === 'identifier') {
				scope.useVar(identifier);
			}

			return identifier.write(scope) + ' = ' + value.write(scope);
		};
	},

	Def: function (args, block) {
		this.type = 'def';
		this.write = function (scope) {
			scope.indent();

			var ending, arg, argString = '',
				defaults = [];
			for (var i = 0, length = args.length; i < length; i++) {
				ending = (length - 1 === i) ? '' : ', ';

				scope.declareVar(args[i].writeName(scope), true);
				arg = args[i].write(scope, defaults);
				defaults = arg[1];
				argString += arg[0] + ending;
			}

			var out = '';
			var lines = 0;
			out += writeBlock(scope, block, function () {
				lines++;
			});

			var variables = scope.printLocal();
			if (variables.length) {
				variables = tab(scope) + variables + ';\n\n';
			} else {
				variables = '';
			}

			var defaultString = '';
			if (defaults.length) {
				for (i = 0, length = defaults.length; i < length; i++) {
					defaultString += tab(scope) + defaults[i][0] + '\n';

					scope.indentTemp();
					defaultString += tab(scope) + defaults[i][1] + '\n';
					scope.dedentTemp();

					defaultString += tab(scope) + defaults[i][2] + '\n';
				}
				defaultString += '\n';
			}

			scope.dedent();
			out += tab(scope) + '}';

			if (lines === 0) {
				return 'function (' + argString + ') {}';
			}

			return 'function (' + argString + ') {\n' + variables + defaultString + out;
		};
	},

	Return: function (expression) {
		this.type = 'return';
		this.write = function (scope) {
			if (expression === undefined) {
				return 'return;';
			} else {
				return 'return ' + expression.write(scope) + ';\n';
			}
		};
	},

	Break: function () {
		this.type = 'break';
		this.write = function () {
			return 'break;';
		};
	},

	Throw: function (expression) {
		this.type = 'throw';
		this.write = function (scope) {
			return 'throw ' + expression.write(scope) + ';';
		}
	},

	If: function (flag, exp, chunks) {
		var elseIfObjs = [];
		var elseObj = false;
		this.type = 'if';
		this.write = function (scope) {
			var out = '';

			if (flag === 'true') {
				out += 'if (' + exp.write(scope) + ' === true) {\n';
			} else {
				out += 'if (' + exp.write(scope) + ') {\n';
			}

			scope.indentTemp();
			out += writeBlock(scope, chunks);
			scope.dedentTemp();

			out += tab(scope) + '}';

			var current;
			for (var i = 0, len = elseIfObjs.length; i < len; i++) {
				current = elseIfObjs[i];

				if (current.flag === 'true') {
					out += ' else if (' + current.exp.write(scope) + ' === true) {\n';
				} else {
					out += ' else if (' + current.exp.write(scope) + ') {\n';
				}

				scope.indentTemp();
				out += writeBlock(scope, current.chunks);
				scope.dedentTemp();

				out += tab(scope) + '}';
			}

			if (elseObj) {
				out += ' else {\n';

				scope.indentTemp();
				out += writeBlock(scope, elseObj.chunks);
				scope.dedentTemp();

				out += tab(scope) + '}\n';
			}

			return out;
		};

		this.addElseIfs = function (elseIfs) {
			elseIfObjs = elseIfs;
			return this;
		};

		this.addElse = function (chunks) {
			elseObj = {
				chunks: chunks
			};
			return this;
		};
	},

	Try: function (chunks) {
		var catchBlock = false;
		var finallyBlock = false;

		this.type = 'try';
		this.write = function (scope) {
			var out = 'try {\n';
			scope.indentTemp();
			out += writeBlock(scope, chunks);
			scope.dedentTemp();
			out += tab(scope) + '}';

			if (catchBlock !== false) {
				out += ' catch (' + catchBlock.id.write(scope) + ') {\n';
				scope.declareVar(catchBlock.id, true);
				scope.indentTemp();
				out += writeBlock(scope, catchBlock.block);
				scope.dedentTemp();
				out += tab(scope) + '}';
			}

			if (finallyBlock !== false) {
				out += ' finally {\n';
				scope.indentTemp();
				out += writeBlock(scope, finallyBlock);
				scope.dedentTemp();
				out += tab(scope) + '}';
			}

			return out;
		};

		this.addCatch = function (obj) {
			catchBlock = obj;
			return this;
		};

		this.addFinally = function (block) {
			finallyBlock = block;
			return this;
		};
	},

	Switch: function (value, cases) {
		this.type = 'switch';
		this.write = function (scope) {
			var out = '';

			var cheat = (value === false) ? true : false;

			out = 'switch (' + ((cheat === true) ? 'false' : value.write(scope)) + ') {\n';

			scope.indentTemp();
			for (var i in cases) {
				var current = cases[i];
				if (current.type === 'default') {
					out += tab(scope) + 'default:\n';

					scope.indentTemp();
					out += current.write(scope);
					scope.dedentTemp();
				} else {
					if (cheat === true) {
						out += tab(scope) + 'case !(' + current.write(scope, {
							which: 'expression'
						}) + '):\n';
					} else {
						out += tab(scope) + 'case ' + current.write(scope, {
							which: 'expression'
						}) + ':\n';
					}

					scope.indentTemp();
					out += current.write(scope, {
						which: 'block'
					});
					scope.dedentTemp();
				}
			}
			scope.dedentTemp();

			out += tab(scope) + '}';
			return out;
		};
	},

	Case: function (flag, expression, block) {
		this.type = flag;
		this.write = function (scope, opts) {
			opts = opts || {};

			if (opts.which === 'expression') {
				// return expression
				return expression.write(scope);
			} else {
				return writeBlock(scope, block);
			}
		};
	},

	For: function (identifier, iterable, alias, block) {
		this.type = 'for';
		this.write = function (scope) {
			// declare looping variables, ex: var i;
			scope.useVar(identifier);

			if (alias !== false) {
				scope.useVar(alias);
			}

			var out = '';

			out += buildIterator(iterable, identifier, scope, exports.yy);

			scope.indentTemp();
			if (alias !== false) {
				if (iterable instanceof[].constructor) {
					out += tab(scope) + alias.write(scope) + ' = ' + identifier.write(scope) + ';\n';
				} else {
					out += tab(scope) + alias.write(scope) + ' = ' + iterable.write(scope) + '[' + identifier.write(scope) + '];\n';
				}
			}
			out += writeBlock(scope, block);
			scope.dedentTemp();

			return out + tab(scope) + '}';
		};
	},

	While: function (comparisons, block) {
		this.type = 'while';
		this.write = function (scope) {
			var out = '';

			out += 'while (' + comparisons.write(scope) + ') {\n';

			scope.indentTemp();
			out += writeBlock(scope, block);
			scope.dedentTemp();

			return out + tab(scope) + '}';
		};
	},

	Id: function (raw) {
		var accessible = false;
		this.type = 'identifier';
		this.write = function () {
			return (accessible ? 'this.' : '') + raw.toString();
		};
		this.accessThis = function () {
			accessible = true;
			return this;
		};
	},

	Comparison: function (a, relation, b) {
		var list = [a, relation];
		if (b !== false) {
			list.push(b);
		}
		this.type = 'comparison';
		this.write = function (scope) {
			var next, out = '';

			for (var i = 0, len = list.length; i < len; i++) {
				next = list[i + 1] || false;

				if (next === 'typeof') {
					// test for same type
					out += '(typeof ' + list[i].write(scope) + ' === ' + list[i + 2].write(scope) + ') ';
					i += 2;
				} else if (next === '!typeof') {
					// test for NOT type
					out += '(typeof ' + list[i].write(scope) + ' !== ' + list[i + 2].write(scope) + ') ';
					i += 2;
				} else if (next === 'instanceof') {
					// test for same instance
					out += '(' + list[i].write(scope) + ' instanceof ' + list[i + 2].write(scope) + ') ';
					i += 2;
				} else if (next === '!instanceof') {
					// test for NOT instance
					out += '!(' + list[i].write(scope) + ' instanceof ' + list[i + 2].write(scope) + ') ';
					i += 2;
				} else {
					if (list[i] === '!=') {
						out += '!== ';
					} else if (list[i] === '==') {
						out += '=== ';
					} else {
						out += (list[i].write ? list[i].write(scope) : list[i]) + ' ';
					}
				}
			}

			return out.trim();
		};
		this.append = function (relation, a, exists) {
			list.push(relation);
			list.push(a);
			if (exists !== false) {
				list.push(exists);
			}
			return this;
		};
	},

	Parameter: function (identifier, defaultValue) {
		this.type = 'parameter';
		this.write = function (scope, defaults) {
			defaults = defaults || [];
			identifier = identifier.write(scope);

			if (defaultValue !== false) {
				var lines = [
					'if (' + identifier + ' === undefined || ' + identifier + ' === null) {',
					identifier + ' = ' + defaultValue.write(scope) + ';',
					'}'
				];

				defaults.push(lines);
			}

			return [identifier, defaults];
		};

		this.writeName = function (scope) {
			return identifier.write(scope);
		};
	},

	Literal: function (type, raw) {
		this.type = 'literal';
		this.write = function () {
			var out;
			switch (type) {
			case 'string':
				out = '\'' + raw + '\'';
				break;
			case 'number':
				out = Number(raw).toString();
				break;
			case 'boolean':
				out = raw;
				break;
			case 'regex':
				out = String(raw);
				break;
			case 'null':
				out = 'null';
				break;
			}
			return out;
		};
	},

	Accessor: function (value, access) {
		this.type = 'accessor';
		this.write = function (scope) {
			var out = '';

			if (access.type === 'index') {
				out = value.write(scope) + '[' + access.val.write(scope) + ']';
			} else if (access.type === 'prop') {
				out = value.write(scope) + '.' + access.val.write(scope);
			}

			return out;
		};
	},

	Call: function (value, args) {
		this.type = 'call';
		this.write = function (scope) {
			var argString = '',
				ending;
			for (var i = 0, length = args.length; i < length; i++) {
				ending = (length - 1 === i) ? '' : ', ';
				argString += args[i].write(scope) + ending;
			}

			return value.write(scope) + '(' + argString + ')';
		};
	},

	Operation: function (relation, a, b) {
		this.type = 'operation';
		this.write = function (scope) {
			// non-JS operations
			var out;
			switch (relation) {
			case '**':
				//((a.type !== 'literal') ? scope.useVar(a) : false);
				//((b.type !== 'literal') ? scope.useVar(b) : false);
				out = 'Math.pow(' + a.write(scope) + ', ' + b.write(scope) + ')';
				break;
			case '++':
				//((a.type !== 'literal') ? scope.useVar(a) : false);
				if (b === true) {
					// increment comes AFTER value
					out = a.write(scope) + '++';
				} else {
					// increment comes BEFORE value
					out = '++' + a.write(scope);
				}
				break;
			case '--':
				//((a.type !== 'literal') ? scope.useVar(a) : false);
				if (b === true) {
					// decrement comes AFTER value
					out = a.write(scope) + '--';
				} else {
					// decrement comes BEFORE value
					out = '--' + a.write(scope);
				}
				break;
			case '?':
				out = '(typeof ' + a.write(scope) + ' !== \'undefined\' && ' + a.write(scope) + ' !== null)';
				break;
			case 'new':
				out = 'new ' + a.write(scope);
				break;
			default:
				//((a.type !== 'literal') ? scope.useVar(a) : false);
				//((b.type !== 'literal') ? scope.useVar(b) : false);
				out = a.write(scope) + ' ' + relation + ' ' + b.write(scope);
			}

			return out;
		};
	},

	Logic: function (relation, a, b) {
		this.type = 'logic';
		this.write = function (scope) {
			return a.write(scope) + ' ' + relation + ' ' + b.write(scope);
		};
	},

	Parenthetical: function (expression) {
		this.type = 'parenthetical';
		this.write = function (scope) {
			return '(' + expression.write(scope) + ')';
		};
	},

	Array: function (elements) {
		var pretty = true;
		this.type = 'array';
		this.write = function (scope) {
			scope.indentTemp();
			var beginning, lines = 0,
				out = '[' + ((pretty) ? '\n' : '');

			for (var i = 0, l = elements.length; i < l; i++) {
				if (typeof elements[i] === 'object') {
					lines++;

					if (pretty === true) {
						beginning = ((i > 0) ? ',\n' : '') + tab(scope);
					} else {
						beginning = ((i > 0) ? ', ' : '');
					}
					out += beginning + elements[i].write(scope);
				}
			}
			scope.dedentTemp();

			if (lines === 0) {
				return '[]';
			} else {
				return out + ((pretty === true) ? '\n' + tab(scope) : '') + ']';
			}
		};
	},

	Object: function (properties) {
		var pretty = true;
		this.type = 'object';
		this.write = function (scope) {
			scope.indentTemp();
			var beginning, lines = 0,
				out = '{' + ((pretty) ? '\n' : '');

			for (var i = 0, l = properties.length; i < l; i++) {
				if (typeof properties[i] === 'object') {
					lines++;

					if (pretty === true) {
						beginning = ((i > 0) ? ',\n' : '') + tab(scope);
					} else {
						beginning = ((i > 0) ? ', ' : '');
					}
					out += beginning + properties[i].key.write(scope) + ': ' + properties[i].val.write(scope);
				}
			}
			scope.dedentTemp();

			if (lines === 0) {
				return '{}';
			} else {
				return out + ((pretty === true) ? '\n' + tab(scope) : '') + '}';
			}
		};
	}
};
})(exports, require);/* parser generated by jison 0.4.13 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Root":3,"TERMINATOR":4,"Chunks":5,"Chunk":6,"Expression":7,"Statement":8,"Block":9,"IND":10,"DED":11,"Value":12,"Operation":13,"Comparison":14,"Assignment":15,"Def":16,"If":17,"Try":18,"For":19,"While":20,"COMMENT":21,"Return":22,"BREAK":23,"THROW":24,"RETURN":25,"Assignable":26,"=":27,"Call":28,"Literal":29,"Parenthetical":30,"Arguments":31,"(":32,")":33,"ArgList":34,",":35,"NEW":36,"++":37,"--":38,"?":39,"Math":40,"MATH":41,"DefHead":42,"DEF":43,":":44,"ParamList":45,"Param":46,"Identifier":47,"IfBlock":48,"ElseIfBlocks":49,"ElseBlock":50,"IF":51,"ElseIf":52,"ELSEIF":53,"ELSE":54,"TryBlock":55,"CatchBlock":56,"FinallyBlock":57,"TRY":58,"CATCH":59,"FINALLY":60,"FOR":61,"IN":62,"Iterable":63,"AS":64,"WHILE":65,"Range":66,"{":67,"..":68,"}":69,"LOGIC":70,".":71,"Accessor":72,"[":73,"]":74,"IDENTIFIER":75,"AlphaNumeric":76,"NULL":77,"Array":78,"Object":79,"Boolean":80,"TRUE":81,"FALSE":82,"NUMBER":83,"STRING":84,"REGEX":85,"InlineElems":86,"BlockElems":87,"InlineProps":88,"BlockProps":89,"$accept":0,"$end":1},
terminals_: {2:"error",4:"TERMINATOR",10:"IND",11:"DED",21:"COMMENT",23:"BREAK",24:"THROW",25:"RETURN",27:"=",32:"(",33:")",35:",",36:"NEW",37:"++",38:"--",39:"?",41:"MATH",43:"DEF",44:":",51:"IF",53:"ELSEIF",54:"ELSE",58:"TRY",59:"CATCH",60:"FINALLY",61:"FOR",62:"IN",64:"AS",65:"WHILE",67:"{",68:"..",69:"}",70:"LOGIC",71:".",73:"[",74:"]",75:"IDENTIFIER",77:"NULL",81:"TRUE",82:"FALSE",83:"NUMBER",84:"STRING",85:"REGEX"},
productions_: [0,[3,1],[3,1],[5,1],[5,2],[6,2],[6,2],[9,4],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[8,1],[8,1],[8,1],[8,2],[22,1],[22,2],[15,3],[12,1],[12,1],[12,1],[12,1],[28,2],[28,2],[31,2],[31,3],[34,1],[34,1],[34,3],[34,3],[13,2],[13,2],[13,2],[13,2],[13,2],[13,2],[13,1],[40,3],[40,3],[16,2],[42,2],[42,5],[45,1],[45,3],[46,1],[46,3],[17,1],[17,2],[17,2],[17,3],[48,6],[48,6],[48,6],[49,1],[49,2],[52,6],[52,6],[52,6],[50,3],[18,1],[18,2],[18,2],[18,3],[55,3],[56,6],[57,3],[19,8],[19,10],[20,6],[63,1],[63,1],[66,5],[14,3],[14,3],[14,3],[14,3],[14,3],[14,3],[26,1],[26,2],[26,2],[72,2],[72,3],[47,1],[29,1],[29,1],[29,1],[29,1],[29,1],[80,1],[80,1],[30,3],[76,1],[76,1],[76,1],[78,2],[78,3],[78,7],[86,1],[86,3],[87,1],[87,3],[87,2],[79,2],[79,3],[79,7],[88,3],[88,5],[89,3],[89,5],[89,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:return new yy.Root([]);
break;
case 2:return new yy.Root($$[$0]);
break;
case 3:this.$ = [$$[$0]];
break;
case 4:$$[$0-1].push($$[$0]);
break;
case 5:this.$ = $$[$0-1];
break;
case 6:this.$ = $$[$0-1];
break;
case 7:this.$ = $$[$0-1];
break;
case 8:this.$ = $$[$0];
break;
case 9:this.$ = $$[$0];
break;
case 10:this.$ = $$[$0];
break;
case 11:this.$ = $$[$0];
break;
case 12:this.$ = $$[$0];
break;
case 13:this.$ = $$[$0];
break;
case 14:this.$ = $$[$0];
break;
case 15:this.$ = $$[$0];
break;
case 16:this.$ = $$[$0];
break;
case 17:/* ignore */
break;
case 18:this.$ = $$[$0];
break;
case 19:this.$ = new yy.Break();
break;
case 20:this.$ = new yy.Throw($$[$0]);
break;
case 21:this.$ = new yy.Return();
break;
case 22:this.$ = new yy.Return($$[$0]);
break;
case 23:this.$ = new yy.Assignment($$[$0-2], $$[$0]);
break;
case 24:this.$ = $$[$0];
break;
case 25:this.$ = $$[$0];
break;
case 26:this.$ = $$[$0];
break;
case 27:this.$ = $$[$0];
break;
case 28:this.$ = new yy.Call($$[$0-1], $$[$0]);
break;
case 29:this.$ = new yy.Call($$[$0-1], $$[$0]);
break;
case 30:this.$ = [];
break;
case 31:this.$ = $$[$0-1];
break;
case 32:this.$ = [$$[$0]];
break;
case 33:this.$ = [$$[$0]];
break;
case 34:$$[$0-2].push($$[$0]);
break;
case 35:$$[$0-2].push($$[$0]);
break;
case 36:this.$ = new yy.Operation("new", $$[$0]);
break;
case 37:this.$ = new yy.Operation("++", $$[$0], false);
break;
case 38:this.$ = new yy.Operation("--", $$[$0], false);
break;
case 39:this.$ = new yy.Operation("++", $$[$0-1], true);
break;
case 40:this.$ = new yy.Operation("--", $$[$0-1], true);
break;
case 41:this.$ = new yy.Operation("?", $$[$0-1]);
break;
case 42:this.$ = $$[$0];
break;
case 43:this.$ = new yy.Operation($$[$0-1], $$[$0-2], $$[$0]);
break;
case 44:this.$ = new yy.Operation($$[$0-1], $$[$0-2], $$[$0]);
break;
case 45:this.$ = new yy.Def($$[$0-1], $$[$0]);
break;
case 46:this.$ = false;
break;
case 47:this.$ = $$[$0-2];
break;
case 48:this.$ = [$$[$0]];
break;
case 49:$$[$0-2].push($$[$0]);
break;
case 50:this.$ = new yy.Parameter($$[$0], false);
break;
case 51:this.$ = new yy.Parameter($$[$0-2], $$[$0]);
break;
case 52:this.$ = $$[$0];
break;
case 53:$$[$0-1].addElseIfs($$[$0]);
break;
case 54:$$[$0-1].addElse($$[$0]);
break;
case 55:$$[$0-2].addElseIfs($$[$0-1]).addElse($$[$0]);
break;
case 56:this.$ = new yy.If("true", $$[$0-3], $$[$0]);
break;
case 57:this.$ = new yy.If("operation", $$[$0-3], $$[$0]);
break;
case 58:this.$ = new yy.If("comparison", $$[$0-3], $$[$0]);
break;
case 59:this.$ = [$$[$0]];
break;
case 60:$$[$0-1].push($$[$0]);
break;
case 61:this.$ = {flag: "true", exp: $$[$0-3], chunks: $$[$0]};
break;
case 62:this.$ = {flag: "operation", exp: $$[$0-3], chunks: $$[$0]};
break;
case 63:this.$ = {flag: "comparison", exp: $$[$0-3], chunks: $$[$0]};
break;
case 64:this.$ = $$[$0];
break;
case 65:this.$ = $$[$0];
break;
case 66:this.$ = $$[$0-1].addCatch($$[$0]);
break;
case 67:this.$ = $$[$0-1].addFinally($$[$01]);
break;
case 68:this.$ = $$[$0-2].addCatch($$[$0-1]).addFinally($$[$0]);
break;
case 69:this.$ = new yy.Try($$[$0]);
break;
case 70:this.$ = {id: $$[$0-3], block: $$[$0]};
break;
case 71:this.$ = $$[$0];
break;
case 72:this.$ = new yy.For($$[$0-5], $$[$0-3], false, $$[$0]);
break;
case 73:this.$ = new yy.For($$[$0-7], $$[$0-5], $$[$0-3], $$[$0]);
break;
case 74:this.$ = new yy.While($$[$0-3], $$[$0]);
break;
case 75:this.$ = $$[$0];
break;
case 76:this.$ = $$[$0];
break;
case 77:this.$ = [$$[$0-3], $$[$0-1]];
break;
case 78:this.$ = new yy.Comparison($$[$0-2], $$[$0-1], $$[$0]);
break;
case 79:this.$ = new yy.Comparison($$[$0-2], $$[$0-1], $$[$0]);
break;
case 80:this.$ = new yy.Comparison($$[$0-2], $$[$0-1], $$[$0]);
break;
case 81:this.$ = new yy.Comparison($$[$0-2], $$[$0-1], $$[$0]);
break;
case 82:this.$ = $$[$0-2].append($$[$0-1], $$[$0], false);
break;
case 83:this.$ = $$[$0-2].append($$[$0-1], $$[$0], false);
break;
case 84:this.$ = $$[$0];
break;
case 85:this.$ = $$[$0].accessThis();
break;
case 86:this.$ = new yy.Accessor($$[$0-1], $$[$0]);
break;
case 87:this.$ = {type: "prop", val: $$[$0]};
break;
case 88:this.$ = {type: "index", val: $$[$0-1]};
break;
case 89:this.$ = new yy.Id($$[$0]);
break;
case 90:this.$ = $$[$0];
break;
case 91:this.$ = new yy.Literal("null");
break;
case 92:this.$ = $$[$0];
break;
case 93:this.$ = $$[$0];
break;
case 94:this.$ = $$[$0];
break;
case 95:this.$ = new yy.Literal("boolean", $$[$0]);
break;
case 96:this.$ = new yy.Literal("boolean", $$[$0]);
break;
case 97:this.$ = new yy.Parenthetical($$[$0-1]);
break;
case 98:this.$ = new yy.Literal("number", $$[$0]);
break;
case 99:this.$ = new yy.Literal("string", $$[$0]);
break;
case 100:this.$ = new yy.Literal("regex", $$[$0]);
break;
case 101:this.$ = new yy.Array([]);
break;
case 102:this.$ = new yy.Array($$[$0-1]);
break;
case 103:this.$ = new yy.Array($$[$0-3]);
break;
case 104:this.$ = [$$[$0]];
break;
case 105:$$[$0-2].push($$[$0]);
break;
case 106:this.$ = [$$[$0]];
break;
case 107:$$[$0-2].push($$[$0]);
break;
case 109:this.$ = new yy.Object([]);
break;
case 110:this.$ = new yy.Object($$[$0-1]);
break;
case 111:this.$ = new yy.Object($$[$0-3]);
break;
case 112:this.$ = [{key: $$[$0-2], val: $$[$0]}];
break;
case 113:$$[$0-4].push({key: $$[$0-2], val: $$[$0]});
break;
case 114:this.$ = [{key: $$[$0-2], val: $$[$0]}];
break;
case 115:$$[$0-4].push({key: $$[$0-2], val: $$[$0]});
break;
}
},
table: [{3:1,4:[1,2],5:3,6:4,7:5,8:6,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:[1,16],22:17,23:[1,18],24:[1,19],25:[1,33],26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{1:[3]},{1:[2,1]},{1:[2,2],6:53,7:5,8:6,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:[1,16],22:17,23:[1,18],24:[1,19],25:[1,33],26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{1:[2,3],11:[2,3],21:[2,3],23:[2,3],24:[2,3],25:[2,3],32:[2,3],36:[2,3],37:[2,3],38:[2,3],43:[2,3],51:[2,3],58:[2,3],61:[2,3],65:[2,3],67:[2,3],71:[2,3],73:[2,3],75:[2,3],77:[2,3],81:[2,3],82:[2,3],83:[2,3],84:[2,3],85:[2,3]},{4:[1,54]},{4:[1,55]},{4:[2,8],11:[2,8],33:[2,8],35:[2,8],41:[1,58],70:[1,56],71:[1,59],72:57,73:[1,60],74:[2,8]},{4:[2,9],11:[2,9],33:[2,9],35:[2,9],70:[1,61],74:[2,9]},{4:[2,10],11:[2,10],33:[2,10],35:[2,10],70:[1,62],74:[2,10]},{4:[2,11],11:[2,11],33:[2,11],35:[2,11],74:[2,11]},{4:[2,12],11:[2,12],33:[2,12],35:[2,12],74:[2,12]},{4:[2,13],11:[2,13],33:[2,13],35:[2,13],74:[2,13]},{4:[2,14],11:[2,14],33:[2,14],35:[2,14],74:[2,14]},{4:[2,15],11:[2,15],33:[2,15],35:[2,15],74:[2,15]},{4:[2,16],11:[2,16],33:[2,16],35:[2,16],74:[2,16]},{4:[2,17]},{4:[2,18]},{4:[2,19]},{7:63,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,24],11:[2,24],31:64,32:[1,65],33:[2,24],35:[2,24],41:[2,24],64:[2,24],68:[2,24],69:[2,24],70:[2,24],71:[2,24],73:[2,24],74:[2,24]},{4:[2,25],11:[2,25],27:[1,69],31:70,32:[1,65],33:[2,25],35:[2,25],37:[1,66],38:[1,67],39:[1,68],41:[2,25],70:[2,25],71:[2,25],73:[2,25],74:[2,25]},{4:[2,26],11:[2,26],33:[2,26],35:[2,26],41:[2,26],64:[2,26],68:[2,26],69:[2,26],70:[2,26],71:[2,26],73:[2,26],74:[2,26]},{4:[2,27],11:[2,27],33:[2,27],35:[2,27],41:[2,27],64:[2,27],68:[2,27],69:[2,27],70:[2,27],71:[2,27],73:[2,27],74:[2,27]},{12:71,26:72,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{12:74,26:73,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{12:74,26:75,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,42],11:[2,42],33:[2,42],35:[2,42],41:[1,76],70:[2,42],74:[2,42]},{4:[1,78],9:77},{4:[2,52],11:[2,52],33:[2,52],35:[2,52],49:79,50:80,52:81,53:[1,83],54:[1,82],74:[2,52]},{4:[2,65],11:[2,65],33:[2,65],35:[2,65],56:84,57:85,59:[1,86],60:[1,87],74:[2,65]},{32:[1,88]},{32:[1,89]},{4:[2,21],7:90,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,84],11:[2,84],27:[2,84],32:[2,84],33:[2,84],35:[2,84],37:[2,84],38:[2,84],39:[2,84],41:[2,84],64:[2,84],69:[2,84],70:[2,84],71:[2,84],73:[2,84],74:[2,84]},{47:91,75:[1,45]},{4:[2,90],11:[2,90],33:[2,90],35:[2,90],41:[2,90],64:[2,90],68:[2,90],69:[2,90],70:[2,90],71:[2,90],73:[2,90],74:[2,90]},{4:[2,91],11:[2,91],33:[2,91],35:[2,91],41:[2,91],64:[2,91],68:[2,91],69:[2,91],70:[2,91],71:[2,91],73:[2,91],74:[2,91]},{4:[2,92],11:[2,92],33:[2,92],35:[2,92],41:[2,92],64:[2,92],68:[2,92],69:[2,92],70:[2,92],71:[2,92],73:[2,92],74:[2,92]},{4:[2,93],11:[2,93],33:[2,93],35:[2,93],41:[2,93],64:[2,93],68:[2,93],69:[2,93],70:[2,93],71:[2,93],73:[2,93],74:[2,93]},{4:[2,94],11:[2,94],33:[2,94],35:[2,94],41:[2,94],64:[2,94],68:[2,94],69:[2,94],70:[2,94],71:[2,94],73:[2,94],74:[2,94]},{7:92,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{32:[1,94],44:[1,93]},{32:[1,95]},{44:[1,96]},{4:[2,89],11:[2,89],27:[2,89],32:[2,89],33:[2,89],35:[2,89],37:[2,89],38:[2,89],39:[2,89],41:[2,89],62:[2,89],64:[2,89],68:[2,89],69:[2,89],70:[2,89],71:[2,89],73:[2,89],74:[2,89]},{4:[2,98],11:[2,98],33:[2,98],35:[2,98],41:[2,98],64:[2,98],68:[2,98],69:[2,98],70:[2,98],71:[2,98],73:[2,98],74:[2,98]},{4:[2,99],11:[2,99],33:[2,99],35:[2,99],41:[2,99],64:[2,99],68:[2,99],69:[2,99],70:[2,99],71:[2,99],73:[2,99],74:[2,99]},{4:[2,100],11:[2,100],33:[2,100],35:[2,100],41:[2,100],64:[2,100],68:[2,100],69:[2,100],70:[2,100],71:[2,100],73:[2,100],74:[2,100]},{4:[1,99],7:100,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],74:[1,97],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48],86:98},{4:[1,103],47:104,69:[1,101],75:[1,45],88:102},{4:[2,95],11:[2,95],33:[2,95],35:[2,95],41:[2,95],64:[2,95],68:[2,95],69:[2,95],70:[2,95],71:[2,95],73:[2,95],74:[2,95]},{4:[2,96],11:[2,96],33:[2,96],35:[2,96],41:[2,96],64:[2,96],68:[2,96],69:[2,96],70:[2,96],71:[2,96],73:[2,96],74:[2,96]},{1:[2,4],11:[2,4],21:[2,4],23:[2,4],24:[2,4],25:[2,4],32:[2,4],36:[2,4],37:[2,4],38:[2,4],43:[2,4],51:[2,4],58:[2,4],61:[2,4],65:[2,4],67:[2,4],71:[2,4],73:[2,4],75:[2,4],77:[2,4],81:[2,4],82:[2,4],83:[2,4],84:[2,4],85:[2,4]},{1:[2,5],11:[2,5],21:[2,5],23:[2,5],24:[2,5],25:[2,5],32:[2,5],36:[2,5],37:[2,5],38:[2,5],43:[2,5],51:[2,5],58:[2,5],61:[2,5],65:[2,5],67:[2,5],71:[2,5],73:[2,5],75:[2,5],77:[2,5],81:[2,5],82:[2,5],83:[2,5],84:[2,5],85:[2,5]},{1:[2,6],11:[2,6],21:[2,6],23:[2,6],24:[2,6],25:[2,6],32:[2,6],36:[2,6],37:[2,6],38:[2,6],43:[2,6],51:[2,6],58:[2,6],61:[2,6],65:[2,6],67:[2,6],71:[2,6],73:[2,6],75:[2,6],77:[2,6],81:[2,6],82:[2,6],83:[2,6],84:[2,6],85:[2,6]},{12:105,13:106,26:107,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,86],11:[2,86],27:[2,86],32:[2,86],33:[2,86],35:[2,86],37:[2,86],38:[2,86],39:[2,86],41:[2,86],64:[2,86],68:[2,86],69:[2,86],70:[2,86],71:[2,86],73:[2,86],74:[2,86]},{12:108,26:72,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{47:109,75:[1,45]},{7:110,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{12:111,13:112,26:107,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{12:113,13:114,26:107,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,20]},{4:[2,29],11:[2,29],32:[2,29],33:[2,29],35:[2,29],41:[2,29],64:[2,29],68:[2,29],69:[2,29],70:[2,29],71:[2,29],73:[2,29],74:[2,29]},{12:117,13:118,26:107,28:20,29:22,30:23,32:[1,41],33:[1,115],34:116,36:[1,24],37:[1,25],38:[1,26],40:27,47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,39],11:[2,39],33:[2,39],35:[2,39],70:[2,39],74:[2,39]},{4:[2,40],11:[2,40],33:[2,40],35:[2,40],70:[2,40],74:[2,40]},{4:[2,41],11:[2,41],33:[2,41],35:[2,41],70:[2,41],74:[2,41]},{7:119,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,28],11:[2,28],32:[2,28],33:[2,28],35:[2,28],41:[2,28],64:[2,28],68:[2,28],69:[2,28],70:[2,28],71:[2,28],73:[2,28],74:[2,28]},{4:[2,36],11:[2,36],33:[2,36],35:[2,36],70:[2,36],71:[1,59],72:57,73:[1,60],74:[2,36]},{4:[2,25],11:[2,25],31:70,32:[1,65],33:[2,25],35:[2,25],41:[2,25],64:[2,25],68:[2,25],69:[2,25],70:[2,25],71:[2,25],73:[2,25],74:[2,25]},{4:[2,37],11:[2,37],31:70,32:[1,65],33:[2,37],35:[2,37],70:[2,37],71:[2,25],73:[2,25],74:[2,37]},{71:[1,59],72:57,73:[1,60]},{4:[2,38],11:[2,38],31:70,32:[1,65],33:[2,38],35:[2,38],70:[2,38],71:[2,25],73:[2,25],74:[2,38]},{12:120,26:72,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,45],11:[2,45],33:[2,45],35:[2,45],74:[2,45]},{10:[1,121]},{4:[2,53],11:[2,53],33:[2,53],35:[2,53],50:122,52:123,53:[1,83],54:[1,82],74:[2,53]},{4:[2,54],11:[2,54],33:[2,54],35:[2,54],74:[2,54]},{4:[2,59],11:[2,59],33:[2,59],35:[2,59],53:[2,59],54:[2,59],74:[2,59]},{44:[1,124]},{32:[1,125]},{4:[2,66],11:[2,66],33:[2,66],35:[2,66],57:126,60:[1,87],74:[2,66]},{4:[2,67],11:[2,67],33:[2,67],35:[2,67],74:[2,67]},{32:[1,127]},{44:[1,128]},{47:129,75:[1,45]},{12:131,13:132,14:130,26:107,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,22]},{4:[2,85],11:[2,85],27:[2,85],32:[2,85],33:[2,85],35:[2,85],37:[2,85],38:[2,85],39:[2,85],41:[2,85],64:[2,85],68:[2,85],69:[2,85],70:[2,85],71:[2,85],73:[2,85],74:[2,85]},{33:[1,133]},{4:[2,46]},{45:134,46:135,47:136,75:[1,45]},{12:137,13:138,14:139,26:107,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[1,78],9:140},{4:[2,101],11:[2,101],33:[2,101],35:[2,101],41:[2,101],64:[2,101],68:[2,101],69:[2,101],70:[2,101],71:[2,101],73:[2,101],74:[2,101]},{35:[1,142],74:[1,141]},{10:[1,143]},{35:[2,104],74:[2,104]},{4:[2,109],11:[2,109],33:[2,109],35:[2,109],41:[2,109],64:[2,109],68:[2,109],69:[2,109],70:[2,109],71:[2,109],73:[2,109],74:[2,109]},{35:[1,145],69:[1,144]},{10:[1,146]},{27:[1,147]},{4:[2,78],11:[2,78],33:[2,78],35:[2,78],41:[1,58],70:[2,78],71:[1,59],72:57,73:[1,60],74:[2,78]},{4:[2,79],11:[2,79],33:[2,79],35:[2,79],70:[2,79],74:[2,79]},{4:[2,25],11:[2,25],31:70,32:[1,65],33:[2,25],35:[2,25],37:[1,66],38:[1,67],39:[1,68],41:[2,25],70:[2,25],71:[2,25],73:[2,25],74:[2,25]},{4:[2,43],11:[2,43],33:[2,43],35:[2,43],41:[2,43],70:[2,43],71:[1,59],72:57,73:[1,60],74:[2,43]},{4:[2,87],11:[2,87],27:[2,87],32:[2,87],33:[2,87],35:[2,87],37:[2,87],38:[2,87],39:[2,87],41:[2,87],64:[2,87],68:[2,87],69:[2,87],70:[2,87],71:[2,87],73:[2,87],74:[2,87]},{74:[1,148]},{4:[2,80],11:[2,80],33:[2,80],35:[2,80],41:[1,58],70:[2,80],71:[1,59],72:57,73:[1,60],74:[2,80]},{4:[2,81],11:[2,81],33:[2,81],35:[2,81],70:[2,81],74:[2,81]},{4:[2,82],11:[2,82],33:[2,82],35:[2,82],41:[1,58],70:[2,82],71:[1,59],72:57,73:[1,60],74:[2,82]},{4:[2,83],11:[2,83],33:[2,83],35:[2,83],70:[2,83],74:[2,83]},{4:[2,30],11:[2,30],32:[2,30],33:[2,30],35:[2,30],41:[2,30],64:[2,30],68:[2,30],69:[2,30],70:[2,30],71:[2,30],73:[2,30],74:[2,30]},{33:[1,149],35:[1,150]},{33:[2,32],35:[2,32],41:[1,58],71:[1,59],72:57,73:[1,60]},{33:[2,33],35:[2,33]},{4:[2,23],11:[2,23],33:[2,23],35:[2,23],74:[2,23]},{4:[2,44],11:[2,44],33:[2,44],35:[2,44],41:[2,44],70:[2,44],71:[1,59],72:57,73:[1,60],74:[2,44]},{5:151,6:4,7:5,8:6,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:[1,16],22:17,23:[1,18],24:[1,19],25:[1,33],26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,55],11:[2,55],33:[2,55],35:[2,55],74:[2,55]},{4:[2,60],11:[2,60],33:[2,60],35:[2,60],53:[2,60],54:[2,60],74:[2,60]},{4:[1,78],9:152},{12:153,13:154,14:155,26:107,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,68],11:[2,68],33:[2,68],35:[2,68],74:[2,68]},{47:156,75:[1,45]},{4:[1,78],9:157},{62:[1,158]},{33:[1,159],70:[1,62]},{41:[1,58],70:[1,56],71:[1,59],72:57,73:[1,60]},{70:[1,61]},{4:[2,97],11:[2,97],33:[2,97],35:[2,97],41:[2,97],64:[2,97],68:[2,97],69:[2,97],70:[2,97],71:[2,97],73:[2,97],74:[2,97]},{33:[1,160],35:[1,161]},{33:[2,48],35:[2,48]},{27:[1,162],33:[2,50],35:[2,50]},{33:[1,163],41:[1,58],70:[1,56],71:[1,59],72:57,73:[1,60]},{33:[1,164],70:[1,61]},{33:[1,165],70:[1,62]},{4:[2,69],11:[2,69],33:[2,69],35:[2,69],59:[2,69],60:[2,69],74:[2,69]},{4:[2,102],11:[2,102],33:[2,102],35:[2,102],41:[2,102],64:[2,102],68:[2,102],69:[2,102],70:[2,102],71:[2,102],73:[2,102],74:[2,102]},{7:166,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{7:168,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48],87:167},{4:[2,110],11:[2,110],33:[2,110],35:[2,110],41:[2,110],64:[2,110],68:[2,110],69:[2,110],70:[2,110],71:[2,110],73:[2,110],74:[2,110]},{47:169,75:[1,45]},{47:171,75:[1,45],89:170},{12:172,26:72,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,88],11:[2,88],27:[2,88],32:[2,88],33:[2,88],35:[2,88],37:[2,88],38:[2,88],39:[2,88],41:[2,88],64:[2,88],68:[2,88],69:[2,88],70:[2,88],71:[2,88],73:[2,88],74:[2,88]},{4:[2,31],11:[2,31],32:[2,31],33:[2,31],35:[2,31],41:[2,31],64:[2,31],68:[2,31],69:[2,31],70:[2,31],71:[2,31],73:[2,31],74:[2,31]},{12:173,13:174,26:107,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{6:53,7:5,8:6,11:[1,175],12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:[1,16],22:17,23:[1,18],24:[1,19],25:[1,33],26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,64],11:[2,64],33:[2,64],35:[2,64],74:[2,64]},{33:[1,176],41:[1,58],70:[1,56],71:[1,59],72:57,73:[1,60]},{33:[1,177],70:[1,61]},{33:[1,178],70:[1,62]},{33:[1,179]},{4:[2,71],11:[2,71],33:[2,71],35:[2,71],74:[2,71]},{12:181,26:72,28:20,29:22,30:23,32:[1,41],47:34,63:180,66:182,67:[1,183],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{44:[1,184]},{44:[1,185]},{46:186,47:136,75:[1,45]},{12:187,26:72,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{44:[1,188]},{44:[1,189]},{44:[1,190]},{35:[2,105],74:[2,105]},{4:[1,192],11:[1,191]},{4:[2,106],11:[2,106]},{27:[1,193]},{4:[1,195],11:[1,194]},{27:[1,196]},{35:[2,112],69:[2,112],71:[1,59],72:57,73:[1,60]},{33:[2,34],35:[2,34],41:[1,58],71:[1,59],72:57,73:[1,60]},{33:[2,35],35:[2,35]},{4:[2,7],11:[2,7],33:[2,7],35:[2,7],53:[2,7],54:[2,7],59:[2,7],60:[2,7],74:[2,7]},{44:[1,197]},{44:[1,198]},{44:[1,199]},{44:[1,200]},{33:[1,201],64:[1,202]},{33:[2,75],64:[2,75],71:[1,59],72:57,73:[1,60]},{33:[2,76],64:[2,76]},{4:[1,103],12:203,26:72,28:20,29:22,30:23,32:[1,41],47:204,67:[1,50],69:[1,101],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48],88:102},{4:[1,78],9:205},{4:[2,47]},{33:[2,49],35:[2,49]},{33:[2,51],35:[2,51],71:[1,59],72:57,73:[1,60]},{4:[1,78],9:206},{4:[1,78],9:207},{4:[1,78],9:208},{4:[1,209]},{4:[2,108],7:210,11:[2,108],12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{12:211,26:72,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[1,212]},{4:[2,116],11:[2,116],47:213,75:[1,45]},{7:214,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[1,78],9:215},{4:[1,78],9:216},{4:[1,78],9:217},{4:[1,78],9:218},{44:[1,219]},{47:220,75:[1,45]},{68:[1,221],71:[1,59],72:57,73:[1,60]},{27:[1,147],32:[2,84],68:[2,84],71:[2,84],73:[2,84]},{4:[2,74],11:[2,74],33:[2,74],35:[2,74],74:[2,74]},{4:[2,56],11:[2,56],33:[2,56],35:[2,56],53:[2,56],54:[2,56],74:[2,56]},{4:[2,57],11:[2,57],33:[2,57],35:[2,57],53:[2,57],54:[2,57],74:[2,57]},{4:[2,58],11:[2,58],33:[2,58],35:[2,58],53:[2,58],54:[2,58],74:[2,58]},{74:[1,222]},{4:[2,107],11:[2,107]},{35:[2,113],69:[2,113],71:[1,59],72:57,73:[1,60]},{69:[1,223]},{27:[1,224]},{4:[2,114],11:[2,114]},{4:[2,61],11:[2,61],33:[2,61],35:[2,61],53:[2,61],54:[2,61],74:[2,61]},{4:[2,62],11:[2,62],33:[2,62],35:[2,62],53:[2,62],54:[2,62],74:[2,62]},{4:[2,63],11:[2,63],33:[2,63],35:[2,63],53:[2,63],54:[2,63],74:[2,63]},{4:[2,70],11:[2,70],33:[2,70],35:[2,70],60:[2,70],74:[2,70]},{4:[1,78],9:225},{33:[1,226]},{12:227,26:72,28:20,29:22,30:23,32:[1,41],47:34,67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,103],11:[2,103],33:[2,103],35:[2,103],41:[2,103],64:[2,103],68:[2,103],69:[2,103],70:[2,103],71:[2,103],73:[2,103],74:[2,103]},{4:[2,111],11:[2,111],33:[2,111],35:[2,111],41:[2,111],64:[2,111],68:[2,111],69:[2,111],70:[2,111],71:[2,111],73:[2,111],74:[2,111]},{7:228,12:7,13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,26:21,28:20,29:22,30:23,32:[1,41],36:[1,24],37:[1,25],38:[1,26],40:27,42:28,43:[1,42],47:34,48:29,51:[1,43],55:30,58:[1,44],61:[1,31],65:[1,32],67:[1,50],71:[1,35],73:[1,49],75:[1,45],76:36,77:[1,37],78:38,79:39,80:40,81:[1,51],82:[1,52],83:[1,46],84:[1,47],85:[1,48]},{4:[2,72],11:[2,72],33:[2,72],35:[2,72],74:[2,72]},{44:[1,229]},{69:[1,230],71:[1,59],72:57,73:[1,60]},{4:[2,115],11:[2,115]},{4:[1,78],9:231},{33:[2,77],64:[2,77]},{4:[2,73],11:[2,73],33:[2,73],35:[2,73],74:[2,73]}],
defaultActions: {2:[2,1],16:[2,17],17:[2,18],18:[2,19],63:[2,20],90:[2,22],93:[2,46],185:[2,47]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();parser.yy = exports.yy; return {parse: function (code, opts) {opts = opts || {}; parser.lexer = new exports.lexer(); var root = parser.parse(code + '\n');return root.compile(opts).trim();},run: function (code, opts) {opts = opts || {};parser.lexer = new exports.lexer();var root = parser.parse(code + '\n');return eval(root.compile(opts).trim());}, VERSION: '1.0.0'};})();if(typeof exports!=='undefined'&&typeof require!=='undefined'){ exports.parse = function () { return Arthur.parse.apply(Arthur,arguments); }; exports.VERSION = Arthur.VERSION;}
