'use strict';

var Fs = require('fs');
var Jison = require('jison').Parser;

//var grammar = require('./src/grammar.js').grammar;
var grammar = require('./src/grammar.js').grammar;
var lexerLib = require('./src/lexer.js').lexer;
var i = -1;
var tokens = ['IF', '(', 'IDENTIFIER', ')', ':', 'TERMINATOR', 'IND', 'IDENTIFIER', '(', ')', 'TERMINATOR', 'DED', 'ELSE', ':', 'TERMINATOR', 'IND', 'IDENTIFIER', '(', ')', 'TERMINATOR', 'DED', 'TERMINATOR'];
var literal = ['if', '(', 'bar', ')', ':', false, false, 'foobar', '(', ')', false, false, 'else', ':', false, false, 'foobar', '(', ')', false, false, false];

function lexer() {
	this.setInput = function (input) {
		return this;
	};
	this.lex = function () {
		i++;
		if (literal[i] !== false) {
			this.yytext = literal[i];
		}
		return tokens[i];
	};
};
var yy = require('./src/yy.js').yy;

var Parser = new Jison(grammar);
Parser.lexer = new lexer();
Parser.yy = yy;

function loadFile(path, callback) {
	callback = callback || function () {};

	Fs.readFile(path, 'utf8', function (err, data) {
		if (err) {
			throw 'File Error: ' + err.toString();
		} else {
			callback(data);
		}
	});
}

loadFile('./test.arthur', function (data) {
	var tokenize = false;
	if (!tokenize) {
		console.log(Parser.parse(data + '\n').compile({
			header: false,
			bare: true
		}));
	} else {
		lexer.setInput(data);
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
		console.log(lexer.lex());
	}
});