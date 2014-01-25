'use strict';

var indent = [0];

var rules = {
	space: [
		/^ +/,
		function (raw) {
			return false;
		}
	],
	terminator: [
		/^\n+/,
		function (raw, lex, increment) {
			var indentation = /^\t*/.exec(lex.remaining.substr(1))[0].length;
			increment(indentation);
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

			//console.log(tokens);
			return tokens;
		}
	],
	identifier: [
		/^[a-z]+/,
		function (raw, lex) {
			if (RESERVED_AR.indexOf(raw) > -1 || RESERVED_JS.indexOf(raw) > -1) {
				// reserved ARTHUR or JS word
				if (raw === 'else' && lex.tokens[lex.tokens.length - 1] === 'TERMINATOR') {
					lex.tokens.pop();
					lex.literals.pop();
				}
				return raw.toUpperCase();
			} else {
				return 'IDENTIFIER';
			}
		}
	],
	logicSymbol: [
		/^\>\=|^\<\=|^\=\=|^\>|^\</,
		function () {
			return 'LOGIC';
		}
	],
	literalSymbol: [
		/^\+\+|^\+|^\-\-|^\.\.|^\.|^\-|^\/|^\*\*|^\*|^\,|^\(|^\)|^\[|^\]|^\{|^\}|^\=|^\:|^\?|^\@/,
		function (raw) {
			if (['+', '-', '*', '/', '**'].indexOf(raw) > -1) {
				return 'MATH';
			} else {
				return raw;
			}
		}
	],
	string: [
		/^\'([^\']*)\'/,
		function () {
			return 'STRING';
		}
	],
	number: [
		/^\-?[0-9]+(?:\.[0-9]+)?/,
		function () {
			return 'NUMBER';
		}
	],
	unexpected: [
		/^./,
		function (raw, lex) {
			throw Error('Unexpected "' + raw + '"');
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

		var result = rule[1](match[0], lex, function (increment) {
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
		while (this.remaining = this.input.slice(this.index)) {
			// check(this, rules[i]);
			// returns `undefined` or `false`

			// returns `number` or `false`
			this.index += check(this, rules.space) ||
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
	}
};