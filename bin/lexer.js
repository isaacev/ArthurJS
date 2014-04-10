// Written by Arthur v1.0.0
(function() {
	var indent, pos, rules, WHITESPACE, RESERVED_AR, RESERVED_JS, check, Lexer;
	indent = [
		0
	];
	pos = {
		col: 0,
		row: 0
	};
	rules = {
		space: [
			/^ +/,
			function (raw) {
				pos.col = pos.col + raw.length;
				return false;
			}
		],
		terminator: [
			/^\n+/,
			function (raw, lex, modify, increment) {
				var indentation, tokens;

				pos.col = 0;
				pos.row = pos.row + raw.length;
				indentation = /^\t*/.exec(lex.remaining.substr(raw.length))[0].length;
				increment(indentation);
				pos.col = pos.col + indentation;
				tokens = [
					'TERMINATOR'
				];
				if (indentation > indent[0]) {
					indent.unshift(indentation);
					tokens.push('IND');
				} else {
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
				pos.col = pos.col + raw.length;
				return 'COMMENT';
			}
		],
		identifier: [
			/^[a-zA-Z\_\$][a-zA-Z0-9\_\$]*/,
			function (raw, lex, modify) {
				var removePrevTerminator;

				pos.col = pos.col + raw.length;
				if ((RESERVED_AR.indexOf(raw) > -1) || (RESERVED_JS.indexOf(raw) > -1)) {
					removePrevTerminator = [
						'else',
						'elseif',
						'catch',
						'finally'
					];
					if ((removePrevTerminator.indexOf(raw) !== -1) && (lex.tokens[lex.tokens.length - 1] === 'TERMINATOR')) {
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
				pos.col = pos.col + raw.length;
				return 'LOGIC';
			}
		],
		literalSymbol: [
			/^\+\=|^\-\=|^\*\=|^\/\=|^\+\+|^\+|^\-\-|^\.\.|^\.|^\-|^\/|^\%|^\*\*|^\*|^\,|^\(|^\)|^\[|^\]|^\{|^\}|^\=|^\:|^\?|^\@|^\!/,
			function (raw) {
				pos.col = pos.col + raw.length;
				if ([
					'+',
					'-',
					'*',
					'/',
					'%',
					'**'
				].indexOf(raw) > -1) {
					return 'MATH';
				} else if ([
					'+=',
					'-=',
					'*=',
					'/='
				].indexOf(raw) > -1) {
					return 'MATH';
				} else {
					return raw;
				}
			}
		],
		string: [
			/^\'(?:[^\'\\]|\\.)*\'/,
			function (raw, lex, modify) {
				pos.col = pos.col + raw.length;
				modify(raw.substr(1).substr(0, raw.length - 2));
				return 'STRING';
			}
		],
		number: [
			/^\-?[0-9]+(?:\.[0-9]+)?/,
			function (raw) {
				pos.col = pos.col + raw.length;
				return 'NUMBER';
			}
		],
		explicit: [
			/^\`(?:[^\`\\]|\\.)*\`/,
			function (raw, lex, modify) {
				pos.col = pos.col + raw.length;
				modify(raw.substr(1).substr(0, raw.length - 2));
				return 'EXPLICIT';
			}
		],
		regex: [
			/^\/(?:[^\/\\]|\\.)+\//,
			function (raw) {
				pos.col = pos.col + raw.length;
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
	WHITESPACE = [
		'TERMINATOR',
		'IND',
		'DED'
	];
	RESERVED_AR = [
		'def',
		'as',
		'elseif'
	];
	RESERVED_JS = [
		'true',
		'false',
		'if',
		'else',
		'return',
		'for',
		'while',
		'in',
		'typeof',
		'instanceof',
		'break',
		'throw',
		'new',
		'switch',
		'case',
		'default',
		'try',
		'catch',
		'finally'
	];
	check = function (lex, rule) {
		var match, advancement, modification, increment, result, i, _i, _len;

		match = rule[0].exec(lex.remaining);
		if (match !== null) {
			advancement = match[0].length;
			modification = function (mod) {
				match[0] = mod;
			};
			increment = function (inc) {
				advancement += inc;
			};
			result = rule[1](match[0], lex, modification, increment);
			if (result !== false) {
				if ((result instanceof Array)) {
					for (i = _i = 0, _len = result.length; _i < _len; i = ++_i) {
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
	};
	Lexer = function () {
		this.tokens = [];
		this.literals = [];
		this.remaining = '';
		this.index = 0;
		this.setInput = function (input) {
			this.input = input;
			this.remaining = input;
		};
		this.lex = function () {
			while (this.remaining.length > 0) {
				this.index = this.index + (check(this, rules.space) || check(this, rules.terminator) || check(this, rules.explicit) || check(this, rules.string) || check(this, rules.number) || check(this, rules.regex) || check(this, rules.comment) || check(this, rules.identifier) || check(this, rules.logicSymbol) || check(this, rules.literalSymbol) || check(this, rules.unexpected));
				this.remaining = this.input.substr(this.index);
			}
			return {
				tokens: this.tokens,
				literals: this.literals
			};
		};
	};
	exports.lexer = function () {
		var tokens, literals, scanner, i;

		tokens = [];
		literals = [];
		scanner = new Lexer();
		i = -1;
		this.setInput = function (input, returnQuick) {
			var results;

			scanner.setInput(input);
			results = scanner.lex();
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
}).call(this);