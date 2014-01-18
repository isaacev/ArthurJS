'use strict';

var Lexer = require('lex');

var row = 1;
var col = 1;

var indent = [0];

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

	if (RESERVED_AR.indexOf(raw) > -1) {
		// reserved ARTHUR word
		return raw.toUpperCase();
	} else if (RESERVED_JS.indexOf(raw) > -1) {
		// reserved JavaScript word
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
lexer.addRule(/\+\+|\+|\-\-|\-|\/|\*\*|\*|\,|\(|\)|\[|\]|\=|\:|\?/, function (raw) {
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

// end of file
lexer.addRule(/$/, function () {
	return 'EOF';
});

var RESERVED_AR = ['def'];
var RESERVED_JS = ['true', 'false', 'if', 'else', 'return'];