'use strict';

var Helpers = require('./helpers.js');
var Scope = require('./scope.js').Scope;

var tab = Helpers.tab;
var writeBlock = Helpers.writeBlock;
var writeLogic = Helpers.writeLogic;
var buildIterator = Helpers.buildIterator;

exports.yy = {
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

			var usesArgs = scope.printUses();
			var usesTails = scope.printUses(true);

			scope.dedent();

			out += ((opts.bare === true) ? '' : tab(scope) + '}).call(this' + usesArgs + ');');
			out = ((opts.bare === true) ? '' : '(function(' + usesTails + ') {\n') + variables + out;

			if (opts.header === true) {
				out = '// Written by Arthur v0.1.0\n\n' + out;
			}

			return out;
		};
	},

	Assignment: function (identifier, value) {
		this.type = 'assignment';
		this.write = function (scope) {
			if (value.type === 'class') {
				value = value.write(scope, {
					name: identifier.write(scope)
				});
			} else {
				value = value.write(scope);
			}

			scope.useVar(identifier);
			return identifier.write(scope) + ' = ' + value;
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

	Use: function (string, alias) {
		this.type = 'use';
		this.write = function (scope) {
			scope.use(string, alias);
			return false;
		};
	},

	Extension: function (string) {
		this.type = 'extension';
		this.write = function (scope) {
			scope.extension(string);
			return false;
		};
	},

	If: function (ifObj, elseIfs, elseObj) {
		this.type = 'if';
		this.write = function (scope) {
			var out = '';

			if (ifObj.flag === 'true') {
				out += 'if (' + ifObj.exp.write(scope) + ' === true) {\n';
			} else if (ifObj.flag === 'exist') {
				out += 'if ((typeof ' + ifObj.exp.write(scope) + ' !== \'undefined\' && ' + ifObj.exp.write(scope) + ' !== null)) {\n';
			} else if (ifObj.flag === 'notExist') {
				out += 'if (typeof ' + ifObj.exp.write(scope) + ' === \'undefined\' && ' + ifObj.exp.write(scope) + ' === null) {\n';
			} else {
				out += 'if (' + ifObj.exp.write(scope) + ') {\n';
			}

			scope.indentTemp();
			out += writeBlock(scope, ifObj.chunks);
			scope.dedentTemp();

			out += tab(scope) + '}';

			if (elseIfs) {
				var currrent;
				for (var i = 0, len = elseIfs.length; i < len; i++) {
					current = elseIfs[i];

					if (current.flag === 'true') {
						out += ' else if (' + ifObj.exp.write(scope) + ' === true) {\n';
					} else if (current.flag === 'exist') {
						out += ' else if ((typeof ' + ifObj.exp.write(scope) + ' !== \'undefined\' && ' + ifObj.exp.write(scope) + ' !== null)) {\n';
					} else if (current.flag === 'notExist') {
						out += ' else if (typeof ' + ifObj.exp.write(scope) + ' === \'undefined\' && ' + ifObj.exp.write(scope) + ' === null) {\n';
					} else {
						out += ' else if (' + ifObj.exp.write(scope) + ') {\n';
					}

					scope.indentTemp();
					out += writeBlock(scope, current.chunks);
					scope.dedentTemp();

					out += tab(scope) + '}';
				}
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
	},

	Try: function (tryBlock, catchId, catchBlock, finallyBlock) {
		this.type = 'try';
		this.write = function (scope) {
			var out = '';

			out = tab(scope) + 'try {\n';

			scope.indentTemp();
			out += writeBlock(scope, tryBlock);
			scope.dedentTemp();

			out += tab(scope) + '}';

			out += ' catch (_err) {\n';

			scope.indentTemp();
			scope.useVar(catchId);
			out += tab(scope) + catchId.write(scope) + ' = _err;\n';
			out += writeBlock(scope, catchBlock);
			scope.dedentTemp();

			out += tab(scope) + '}';

			if (finallyBlock !== false) {
				out += ' finally {\n';

				scope.indentTemp();
				out += writeBlock(scope, finallyBlock);
				scope.dedentTemp();

				out += tab(scope) + '}';
			}

			return out;
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

	While: function (comparator, block) {
		this.type = 'while';
		this.write = function (scope) {
			var out = '';

			out += 'while (' + writeLogic(comparator, scope) + ') {\n';

			scope.indentTemp();
			out += writeBlock(scope, block);
			scope.dedentTemp();

			return out + tab(scope) + '}';
		};
	},

	Id: function (raw) {
		this.type = 'identifier';
		this.write = function () {
			return raw.toString();
		};
	},

	Comparison: function (relation, a, b) {
		this.type = 'comparison';
		this.write = function (scope) {
			var out = '';
			if (relation == '?') {
				// test for existance
				out += '(typeof ' + a.write(scope) + ' !== \'undefined\' && ' + a.write(scope) + ' !== null)'
			} else {
				out += a.write(scope) + ' ';
				out += relation + ' ';
				out += b.write(scope);
			}

			return out;
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
			}
			return out;
		};
	},

	Accessor: function (value, access) {
		this.type = 'accessor';
		this.write = function (scope) {
			return value.write(scope) + '[' + access.write(scope) + ']';
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
				scope.useVar(a);
				scope.useVar(b);
				out = 'Math.pow(' + a.write(scope) + ', ' + b.write(scope) + ')';
				break;
			case '++':
				scope.useVar(a);
				if (b === true) {
					// increment comes AFTER value
					out = a.write(scope) + '++';
				} else {
					out = '++' + a.write(scope);
				}
				break;
			case '--':
				scope.useVar(a);
				if (b === true) {
					// decrement comes AFTER value
					out = a.write(scope) + '--';
				} else {
					out = '--' + a.write(scope);
				}
				break;
			default:
				scope.useVar(a);
				scope.useVar(b);
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
		var pretty = false;
		this.type = 'array';
		this.write = function (scope) {
			scope.indentTemp();
			var beginning, lines = 0,
				out = '[' + ((pretty) ? '\n' : '');

			for (var i = 0, l = elements.length; i < l; i++) {
				if (typeof elements[i] === 'object') {
					lines++;

					if (pretty === true) {
						beginning = ((i > 0) ? ', \n' : '') + tab(scope);
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
		var pretty = false;
		this.type = 'object';
		this.write = function (scope) {
			scope.indentTemp();
			var beginning, lines = 0,
				out = '{' + ((pretty) ? '\n' : '');

			for (var i = 0, l = properties.length; i < l; i++) {
				if (typeof properties[i] === 'object') {
					lines++;

					if (pretty === true) {
						beginning = ((i > 0) ? ', \n' : '') + tab(scope);
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