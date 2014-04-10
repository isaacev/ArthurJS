// Written by Arthur v1.0.0
(function() {
	var Parser, Lexer, Yy;
	Parser = require('./parser.js');
	Lexer = require('./lexer.js').lexer;
	Yy = require('./yy.js').yy;
	Parser.parser.yy = Yy;
	exports.VERSION = '1.0.0';
	exports.parse = function (code, opts) {
		var root;

		Parser.parser.lexer = new Lexer();
		root = Parser.parse(code + '\n');
		return root.compile(opts).trim();
	};
}).call(this);