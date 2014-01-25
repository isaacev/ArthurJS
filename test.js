var Fs = require('fs');
var Jison = require('jison').Parser;

var grammar = require('./src/grammar.js').grammar;
var lexer = require('./src/lexer2.js').lexer;
var yy = require('./src/yy.js').yy;

var Parser = new Jison(grammar);
Parser.lexer = new lexer();
Parser.yy = yy;

Fs.readFile('./test.arthur', 'utf8', function (err, data) {
	Parser.parse(data + '\n');
});