'use strict';

var Lexer = require('lex');

var row = 1;
var col = 1;
var indent = [0];

var ongoing = [];

var lexer = exports.lexer = new Lexer(function (char) {
	throw new Error('Unexpected character at row ' + row + ', col ' + ': "' + char + '"');
});

// ignore spaces
lexer.addRule(/ +/, function (raw) {
	col += raw.length;
});

// process indent and dedent
lexer.addRule(/^\t*/gm, function (raw) {
	var indentation = raw.length;

	col += indentation;

	if (indentation > indent[0]) {
		indent.unshift(indentation);
		return 'IND';
	}

	var tokens = [];

	while (indentation < indent[0]) {
		tokens.push('DED');
		tokens.push('TERMINATOR');
		indent.shift();
	}

	if (tokens.length) {
		return tokens;
	}
});

// comments
lexer.addRule(/\#[^\n]*/, function (raw) {
	row += raw.length;
	return 'COMMENT';
});

// terminators
lexer.addRule(/\n+/, function (raw) {
	row += raw.length;
	return 'TERMINATOR';
});

// identifier or keyword
lexer.addRule(/[a-zA-Z]+/, function (raw) {
	col += raw.length;
	this.yytext = raw;

	var out;
	if (RESERVED_AR.indexOf(raw) > -1 || RESERVED_JS.indexOf(raw) > -1) {
		// reserved ARTHUR or JS word
		return raw.toUpperCase();
	} else {
		return 'IDENTIFIER';
	}
});

// logical symbols
lexer.addRule(/\>\=|\<\=|\=\=|\>|\</, function (raw) {
	col += raw.length;
	this.yytext = raw;

	return 'LOGIC';
});

// literal symbols
lexer.addRule(/\+\+|\+|\-\-|\.\.|\.|\-|\/|\*\*|\*|\,|\(|\)|\[|\]|\{|\}|\=|\:|\?|\@/, function (raw) {
	col += raw.length;
	this.yytext = raw;

	if (['+', '-', '*', '/', '**'].indexOf(raw) > -1) {
		return 'MATH';
	} else {
		return raw;
	}
});

// strings
lexer.addRule(/\'([^\']*)\'/, function (raw, unquoted) {
	col += raw.length;
	this.yytext = unquoted;
	return 'STRING';
});

// numbers
lexer.addRule(/\-?[0-9]+(?:\.[0-9]+)?/, function (raw) {
	col += raw.length;
	this.yytext = raw;
	return 'NUMBER';
});

var RESERVED_AR = ['def', 'as', 'elseif'];
var RESERVED_JS = ['true', 'false', 'if', 'else', 'return', 'for', 'while', 'in'];
var BLOCKING = ['def', 'if', 'else', 'for', 'while'];