'use strict';

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