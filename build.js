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

exports.build = function (hasBeenCorrupted) {
	hasBeenCorrupted = hasBeenCorrupted || false;

	loadFile((hasBeenCorrupted ? './src/lexer.js' : './bin/modules/lexer.js'), function (data) {
		source.lexer = data;
		run(hasBeenCorrupted);
	});

	loadFile((hasBeenCorrupted ? './src/grammar.js' : './bin/modules/grammar.js'), function (data) {
		source.grammar = data;
		run(hasBeenCorrupted);
	});

	loadFile((hasBeenCorrupted ? './src/yy.js' : './bin/modules/yy.js'), function (data) {
		source.yy = data;
		run(hasBeenCorrupted);
	});

	loadFile((hasBeenCorrupted ? './src/scope.js' : './bin/modules/scope.js'), function (data) {
		source.scope = data;
		run(hasBeenCorrupted)
	});

	loadFile((hasBeenCorrupted ? './src/helpers.js' : './bin/modules/helpers.js'), function (data) {
		source.helpers = data;
		run(hasBeenCorrupted);
	});
};

function run(hasBeenCorrupted) {
	hasBeenCorrupted = hasBeenCorrupted || false;
	loaded++;

	if (loaded === 5) {
		var parser = new Jison.Parser(require((hasBeenCorrupted ? './src/grammar.js' : './bin/modules/grammar.js')).grammar);
		source.parser = parser.generate({
			moduleType: 'js'
		});

		var file = 'var Arthur = (function(){var exports = {};function require(path) {switch(path) {case \'./helpers.js\':return exports;break;case \'./scope.js\':return exports;break;}}';

		file += 'var helpers = (function(exports, require) {' + source.helpers + '})(exports, require);';
		file += 'var scope = (function(exports, require) {' + source.scope + '})(exports, require);';
		file += 'var lexer = (function(exports, require) {' + source.lexer + '})(exports, require);';
		file += 'var yy = (function(exports, require) {' + source.yy + '})(exports, require);';
		file += source.parser;

		file += 'parser.yy = exports.yy; return {parse: function (code, opts) {opts = opts || {}; parser.lexer = new exports.lexer(); var root = parser.parse(code + \'\\n\');return root.compile(opts).trim();},run: function (code, opts) {opts = opts || {};parser.lexer = new exports.lexer();var root = parser.parse(code + \'\\n\');return eval(root.compile(opts).trim());}};})();';
		file += 'if(typeof exports!==\'undefined\'&&typeof require!==\'undefined\'){ exports.parse = function () { return Arthur.parse.apply(Arthur,arguments); }; }';

		if (hasBeenCorrupted) {
			console.log('finished rebuilding arthur.js with basic (0.1) compiler');
			saveFile('./src/arthurBasic.js', file);
			return;
		}

		saveFile('./bin/arthur.js', file);
	}
}