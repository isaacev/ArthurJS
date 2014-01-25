var Fs = require('fs');
var Jison = require('jison').Parser;

var grammar = require('./src/grammar.js').grammar;
var lexer = require('./src/lexer.js').lexer;
var yy = require('./src/yy.js').yy;

var Parser = new Jison(grammar);
Parser.lexer = new lexer();
Parser.yy = yy;

Fs.readFile('./test.arthur', 'utf8', function (err, data) {
	console.log(Parser.parse(data + '\n').compile({
		bare: false,
		header: true
	}));
	//console.log((new lexer()).setInput(data, true));
});