// Written by Arthur v1.0.0
(function() {
	var Helpers, Scope, tab, writeBlock, buildIterator;
	Helpers = require('./helpers.js');
	Scope = require('./scope.js').Scope;
	tab = Helpers.tab;
	writeBlock = Helpers.writeBlock;
	buildIterator = Helpers.buildIterator;
	exports.yy = {
		Root: function (lines) {
			this.type = 'root';
			this.compile = function (opts) {
				var out, scope, variables;

				if (opts === undefined || opts === null) {
					opts = {};
				}

				out = '';
				scope = new Scope();
				scope.indent();
				if (opts.bare === true) {
					scope.dedentTemp();
				}
				out += writeBlock(scope, lines);
				variables = scope.printLocal();
				if (variables.length > 0) {
					variables = tab(scope) + variables + ';\n';
				} else {
					variables = '';
				}
				if (opts.bare === true) {
					scope.indentTemp();
				}
				scope.dedent();
				if (opts.bare !== true) {
					out = '(function() {\n' + variables + out.replace(/\s+$/, '\n') + tab(scope) + '}).call(this);';
				} else {
					out = variables + '\n' + out.replace(/s+$/, '');
				}
				if (opts.header === true) {
					out = '// Written by Arthur v1.0.0\n' + out;
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
				var argString, defaults, i, arg, _i, _len, ending, out, lines, increment, variables, defaultString, _, _len2;

				scope.indent();
				argString = '';
				defaults = [];
				for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
					arg = args[i];
					scope.declareVar(arg, true);
					if ((args.length - 1) === i) {
						ending = '';
					} else {
						ending = ', ';
					}
					scope.declareVar(arg.writeName(scope), true);
					arg = arg.write(scope, defaults);
					defaults = arg[1];
					argString += arg[0] + ending;
				}
				out = '';
				lines = 0;
				increment = function () {
					lines++;
				};
				out += writeBlock(scope, block, increment);
				variables = scope.printLocal();
				if (variables.length > 0) {
					variables = tab(scope) + variables + ';\n\n';
				} else {
					variables = '';
				}
				defaultString = '';
				if (defaults.length > 0) {
					for (i = _ = 0, _len2 = defaults.length; _ < _len2; i = ++_) {
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
					out = 'function (' + argString + ') {}';
				}
				out = 'function (' + argString + ') {\n' + variables + defaultString + out;
				return out;
			};
		},
		Return: function (expression) {
			this.type = 'return';
			this.write = function (scope) {
				if ((typeof expression !== 'undefined' && expression !== null)) {
					return 'return ' + expression.write(scope) + ';\n';
				} else {
					return 'return;';
				}
			};
		},
		Break: function () {
			this.type = 'break';
			this.write = function () {
				return 'break;';
			};
		},
		Comment: function (raw) {
			this.type = 'comment';
			this.write = function (scope) {
				return '// ' + raw;
			};
		},
		If: function (flag, exp, chunks) {
			var elseIfObjs, elseObj;

			elseIfObjs = [];
			elseObj = false;
			this.type = 'if';
			this.write = function (scope) {
				var out, i, current, _i, _len;

				out = '';
				if (flag === 'true') {
					out += 'if (' + exp.write(scope) + ' === true) {\n';
				} else {
					out += 'if (' + exp.write(scope) + ') {\n';
				}
				scope.indentTemp();
				out += writeBlock(scope, chunks);
				scope.dedentTemp();
				out += tab(scope) + '}';
				for (i = _i = 0, _len = elseIfObjs.length; _i < _len; i = ++_i) {
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
				if (elseObj !== false) {
					out += ' else {\n';
					scope.indentTemp();
					out += writeBlock(scope, elseObj.chunks);
					scope.dedentTemp();
					out += tab(scope) + '}';
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
			var catchBlock, finallyBlock;

			catchBlock = false;
			finallyBlock = false;
			this.type = 'try';
			this.write = function (scope) {
				var out;

				out = 'try {\n';
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
		Throw: function (expression) {
			this.type = 'throw';
			this.write = function (scope) {
				return 'throw ' + expression.write(scope);
			};
		},
		For: function (identifier, iterable, alias, block) {
			this.type = 'for';
			this.write = function (scope) {
				var out;

				scope.useVar(identifier);
				if (alias !== false) {
					scope.useVar(alias);
				}
				out = '';
				out += buildIterator(iterable, identifier, scope, exports.yy);
				scope.indentTemp();
				if (alias !== false) {
					if ((iterable instanceof Array)) {
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
				var out;

				out = 'while (' + comparisons.write(scope) + ') {\n';
				scope.indentTemp();
				out += writeBlock(scope, block);
				scope.dedentTemp();
				return out + tab(scope) + '}';
			};
		},
		Switch: function (test, cases) {
			this.type = 'switch';
			this.write = function (scope) {
				var out, i, current, _i, _len;

				out = '';
				if (test === false) {
					out = 'switch (false) {\n';
				} else {
					out = 'switch (' + test.write(scope) + ') {\n';
				}
				scope.indentTemp();
				for (i = _i = 0, _len = cases.length; _i < _len; i = ++_i) {
					current = cases[i];
					out += tab(scope) + 'case ' + current.test.write(scope) + ':\n';
					scope.indentTemp();
					out += writeBlock(scope, current.chunks);
					scope.dedentTemp();
				}
				scope.indentTemp();
				return out + tab(scope) + '}';
			};
		},
		Id: function (raw) {
			var accessible;

			accessible = false;
			this.type = 'identifier';
			this.write = function () {
				if (accessible === true) {
					return 'this.' + raw.toString();
				} else {
					return raw.toString();
				}
			};
			this.accessThis = function () {
				accessible = true;
				return this;
			};
		},
		Comparison: function (a, relation, b) {
			this.type = 'comparison';
			this.write = function (scope) {
				var out;

				out = '';
				if (relation === '?') {
					out = '(typeof ' + a.write(scope) + ' !== \'undefined\' && ' + a.write(scope) + ' !== null)';
				} else if (relation === 'typeof') {
					out = '(typeof ' + a.write(scope) + ' === ' + b.write(scope) + ')';
				} else if (relation === '!typeof') {
					out = '(typeof ' + a.write(scope) + ' !== ' + b.write(scope) + ')';
				} else if (relation === 'instanceof') {
					out = '(' + a.write(scope) + ' instanceof ' + b.write(scope) + ')';
				} else if (relation === '!instanceof') {
					out = '!(' + a.write(scope) + ' instanceof ' + b.write(scope) + ')';
				} else {
					if (relation === '!=') {
						relation = '!==';
					} else if (relation === '==') {
						relation = '===';
					}
					out = a.write(scope) + ' ' + relation + ' ' + b.write(scope);
				}
				return out;
			};
		},
		Parameter: function (identifier, defaultValue) {
			this.type = 'parameter';
			this.write = function (scope, defaults) {
				var lines;

				if (defaults === undefined || defaults === null) {
					defaults = [];
				}

				if (defaultValue !== false) {
					lines = [
						'if (' + identifier.write(scope) + ' === undefined || ' + identifier.write(scope) + ' === null) {',
						identifier.write(scope) + ' = ' + defaultValue.write(scope) + ';',
						'}'
					];
					defaults.push(lines);
				}
				return [
					identifier.write(scope),
					defaults
				];
			};
			this.writeName = function (scope) {
				return identifier.write(scope);
			};
		},
		Literal: function (type, raw) {
			this.type = 'literal';
			this.write = function () {
				var out;

				if (type === 'string') {
					out = '\'' + raw + '\'';
				} else if (type === 'number') {
					out = Number(raw).toString();
				} else if (type === 'boolean') {
					out = raw;
				} else if (type === 'explicit') {
					out = raw;
				} else if (type === 'regex') {
					out = String(raw);
				}
				return out;
			};
		},
		Accessor: function (value, access) {
			this.type = 'accessor';
			this.write = function (scope) {
				var out;

				if (access.type === 'index') {
					out = value.write(scope) + '[' + access.val.write(scope) + ']';
				} else if (access.type === 'prop') {
					out = value.write(scope) + '.' + access.val.write(scope);
				}
				return out;
			};
		},
		Call: function (value, args) {
			var callback;

			callback = [];
			this.type = 'call';
			this.write = function (scope) {
				var argString, i, arg, _i, _len, ending, func, _, _len2;

				argString = '';
				for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
					arg = args[i];
					if ((args.length - 1) === i) {
						ending = '';
					} else {
						ending = ', ';
					}
					argString += arg.write(scope) + ending;
				}
				if (callback.length > 0) {
					for (i = _ = 0, _len2 = callback.length; _ < _len2; i = ++_) {
						func = callback[i];
						if (argString.length > 0) {
							argString += ', ' + func.write(scope);
						} else {
							argString = func.write(scope);
						}
					}
				}
				return value.write(scope) + '(' + argString + ')';
			};
			this.callback = function (funcs) {
				callback = funcs;
				return this;
			};
		},
		Operation: function (relation, a, b) {
			this.type = 'operation';
			this.write = function (scope) {
				var out;

				if (relation === '**') {
					out = 'Math.pow(' + a.write(scope) + ', ' + b.write(scope) + ')';
				} else if (relation === '++') {
					if (b === true) {
						out = a.write(scope) + '++';
					} else {
						out = '++' + a.write(scope);
					}
				} else if (relation === '--') {
					if (b === true) {
						out = a.write(scope) + '--';
					} else {
						out = '--' + a.write(scope);
					}
				} else if (relation === '?') {
					out = '(typeof ' + a.write(scope) + ' !== \'undefined\' && ' + a.write(scope) + ' !== null)';
				} else if (relation === 'new') {
					out = 'new ' + a.write(scope);
				} else {
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
			var pretty;

			pretty = true;
			this.type = 'array';
			this.write = function (scope) {
				var lines, out, i, element, _i, _len, beginning;

				scope.indentTemp();
				lines = 0;
				if (pretty === true) {
					out = '[\n';
				} else {
					out = '[';
				}
				for (i = _i = 0, _len = elements.length; _i < _len; i = ++_i) {
					element = elements[i];
					if ((typeof element === 'object')) {
						lines++;
						if (pretty === true) {
							if (i > 0) {
								beginning = ',\n' + tab(scope);
							} else {
								beginning = tab(scope);
							}
						} else {
							if (i > 0) {
								beginning = ', ' + tab(scope);
							} else {
								beginning = tab(scope);
							}
						}
						out += beginning + element.write(scope);
					}
				}
				scope.dedentTemp();
				if (lines === 0) {
					return '[]';
				} else {
					if (pretty === true) {
						return out + '\n' + tab(scope) + ']';
					} else {
						return out + ']';
					}
				}
			};
		},
		Object: function (properties) {
			var pretty;

			pretty = true;
			this.type = 'object';
			this.write = function (scope) {
				var lines, out, i, property, _i, _len, beginning;

				scope.indentTemp();
				lines = 0;
				if (pretty === true) {
					out = '{\n';
				} else {
					out = '{';
				}
				for (i = _i = 0, _len = properties.length; _i < _len; i = ++_i) {
					property = properties[i];
					if ((typeof property === 'object')) {
						lines++;
						if (pretty === true) {
							if (i > 0) {
								beginning = ',\n' + tab(scope);
							} else {
								beginning = tab(scope);
							}
						} else {
							if (i > 0) {
								beginning = ', ';
							} else {
								beginning = '';
							}
						}
						out += beginning + property.key.write(scope) + ': ' + property.val.write(scope);
					}
				}
				scope.dedentTemp();
				if (lines === 0) {
					return '{}';
				} else {
					if (pretty === true) {
						return out + '\n' + tab(scope) + '}';
					} else {
						return out + '}';
					}
				}
			};
		}
	};
}).call(this);