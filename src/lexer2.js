'use strict';

var indent = [0];

var rules = {
	space: [
		/^ +/,
		function (raw) {
			return false;
		}
	],
	indentation: [
		/^\t+/,
		function (raw, lex) {
			console.log('indent');
			var indentation = raw.length;

			if (indentation > indent[0]) {
				indent.unshift(indentation);
				return 'IND';
			}

			var tokens = [];

			while (indentation < indent[0]) {
				tokens.push('DED');
				indent.shift();
			}

			if (tokens.length) {
				return tokens;
			}

			return false;
		}
	],
	terminator: [
		/^\n+/,
		function (raw) {
			return 'TERMINATOR';
		}
	],
	identifier: [
		/^[a-z]+/,
		function (raw) {
			if (RESERVED_AR.indexOf(raw) > -1 || RESERVED_JS.indexOf(raw) > -1) {
				// reserved ARTHUR or JS word
				return raw.toUpperCase();
			} else {
				return 'IDENTIFIER';
			}
		}
	],
	logicSymbol: [
		/\>\=|\<\=|\=\=|\>|\</,
		function () {
			return 'LOGIC';
		}
	],
	literalSymbol: [
		/\+\+|\+|\-\-|\.\.|\.|\-|\/|\*\*|\*|\,|\(|\)|\[|\]|\{|\}|\=|\:|\?|\@/,
		function (raw) {
			if (['+', '-', '*', '/', '**'].indexOf(raw) > -1) {
				return 'MATH';
			} else {
				return raw;
			}
		}
	],
	string: [
		/\'([^\']*)\'/,
		function () {
			return 'STRING';
		}
	],
	number: [
		/\-?[0-9]+(?:\.[0-9]+)?/,
		function () {
			return 'NUMBER';
		}
	],
	unexpected: [
		/^./,
		function (raw) {
			throw Error('Unexpected ' + raw);
		}
	]
};

var WHITESPACE = ['TERMINATOR', 'IND', 'DED'];
var RESERVED_AR = ['def', 'as', 'elseif'];
var RESERVED_JS = ['true', 'false', 'if', 'else', 'return', 'for', 'while', 'in'];

function check(lex, rule) {
	var match = rule[0].exec(lex.remaining);
	if (match !== null) {
		// advance the index
		var advancement = match[0].length;

		var result = rule[1](match[0], lex);
		if (result !== false) {
			if (result instanceof Array) {
				// multiple tokens returned
				for (var i = 0, len = result.length; i < len; i++) {
					lex.literals.push(false);
					lex.tokens.push(result[i]);
					console.log('ARRAY', result[i]);
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
		while (this.remaining = this.input.slice(this.index)) {
			// check(this, rules[i]);
			// returns `undefined` or `false`

			// returns `number` or `false`
			this.index += check(this, rules.space) ||
				check(this, rules.indentation) ||
				check(this, rules.terminator) ||
				check(this, rules.identifier) ||
				check(this, rules.logicSymbol) ||
				check(this, rules.literalSymbol) ||
				check(this, rules.string) ||
				check(this, rules.number) ||
				check(this, rules.unexpected);
		}
		return {
			tokens: this.tokens,
			literals: this.literals
		};
	};
}

exports.lexer = function () {
	var scanner = new Lexer();
	var tokens, literals;
	var i = -1;
	this.setInput = function (input) {
		scanner.setInput(input);
		var results = scanner.lex();
		tokens = results.tokens;
		literals = results.literals;
		console.log(tokens);
		return this;
	};

	this.lex = function () {
		i++;
		if (literals[i] !== false) {
			this.yytext = literals[i];
		}
		return tokens[i];
	}
};