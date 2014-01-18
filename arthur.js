'use strict';

var Fs = require('fs');
var Jison = require('jison').Parser;

var grammar = require('./src/grammar.js').grammar;
var lexer = require('./src/lexer.js').lexer;
var yy = require('./src/yy.js').yy;

var Parser = new Jison(grammar);
Parser.lexer = lexer;
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
	console.log(Parser.parse(data + '\n').compile({
		bare: true
	}));
});