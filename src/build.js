var Fs = require('fs');
var Jison = require('jison');

function loadFile(path, callback) {
	Fs.readFile(path, 'utf8', function (err, data) {
		if (err) {
			throw Error(err.toString());
		} else {
			callback(data + '\n');
		}
	});
}

function saveFile(path, data) {
	Fs.writeFile(path, data, function (err) {
		if (err) {
			throw Error('problem saving to ' + path);
		}
	});
}

var source = {};
var loaded = 0;

loadFile('./lexer.js', function (data) {
	source.lexer = data;
	run();
});

loadFile('./grammar.js', function (data) {
	source.grammar = data;
	run();
});

loadFile('./yy.js', function (data) {
	source.yy = data;
	run();
});

loadFile('./scope.js', function (data) {
	source.scope = data;
	run()
});

loadFile('./helpers.js', function (data) {
	source.helpers = data;
	run();
});

function run() {
	loaded++;

	if (loaded === 5) {
		var parser = new Jison.Parser(require('./grammar.js').grammar);
		source.parser = parser.generate({
			moduleType: 'js'
		});

		var file = 'var Arthur = (function(){var exports = {};function require(path) {switch(path) {case \'./helpers.js\':return exports;break;case \'./scope.js\':return exports;break;}}';

		file += 'var helpers = (function(exports, require) {' + source.helpers + '})(exports, require);';
		file += 'var yy = (function(exports, require) {' + source.scope + '})(exports, require);';
		file += 'var lexer = (function(exports, require) {' + source.lexer + '})(exports, require);';
		file += 'var yy = (function(exports, require) {' + source.yy + '})(exports, require);';
		file += source.parser;

		file += 'parser.yy = exports.yy; return {parse: function (code, opts) {opts = opts || {}; parser.lexer = new exports.lexer(); var root = parser.parse(code + \'\\n\');return root.compile(opts).trim();}};})();';
		file += 'if(typeof exports!==\'undefined\'&&typeof require!==\'undefined\'){ exports.parse = function () { return Arthur.parse.apply(Arthur,arguments); }; }';

		saveFile('../bin/arthur.js', file);
	}
}