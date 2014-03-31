var Fs = require('fs');
var Jison = require('jison');
var Spawn = require('child_process').spawn;

var VERSION = '\'1.0.0\'';

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

function uglify(path) {
	var term = Spawn('uglifyjs', [path]);
	var chunks = '';

	term.stderr.on('data', function (data) {
		// console.log(process.stderr.write(data.toString()));
	});

	term.stdout.on('data', function (data) {
		chunks += data.toString();
	});

	term.on('exit', function (code) {
		if (code === 0) {
			saveFile('./bin/arthur.min.js', chunks);
		} else {
			console.log(arguments);
		}
	})
	console.log('uglified');
}

var source = {};
var loaded = 0;

var corruptPath = './original/';
var regPath = './bin/';

exports.build = function (hasBeenCorrupted) {
	hasBeenCorrupted = hasBeenCorrupted || false;

	loadFile((hasBeenCorrupted ? corruptPath : regPath) + 'lexer.js', function (data) {
		source.lexer = data;
		run(hasBeenCorrupted);
	});

	loadFile((hasBeenCorrupted ? corruptPath : regPath) + 'grammar.js', function (data) {
		source.grammar = data;
		run(hasBeenCorrupted);
	});

	loadFile((hasBeenCorrupted ? corruptPath : regPath) + 'yy.js', function (data) {
		source.yy = data;
		run(hasBeenCorrupted);
	});

	loadFile((hasBeenCorrupted ? corruptPath : regPath) + 'scope.js', function (data) {
		source.scope = data;
		run(hasBeenCorrupted)
	});

	loadFile((hasBeenCorrupted ? corruptPath : regPath) + 'helpers.js', function (data) {
		source.helpers = data;
		run(hasBeenCorrupted);
	});
};

function run(hasBeenCorrupted) {
	hasBeenCorrupted = hasBeenCorrupted || false;
	loaded++;

	if (loaded === 5) {
		var parser = new Jison.Parser(require((hasBeenCorrupted ? './src/grammar.js' : './bin/grammar.js')).grammar);
		source.parser = parser.generate({
			moduleType: 'js'
		});

		var file = 'var Arthur = (function(){var exports = {};function require(path) {switch(path) {case \'./helpers.js\':return exports;break;case \'./scope.js\':return exports;break;}}';

		file += 'var helpers = (function(exports, require) {' + source.helpers + '})(exports, require);';
		file += 'var scope = (function(exports, require) {' + source.scope + '})(exports, require);';
		file += 'var lexer = (function(exports, require) {' + source.lexer + '})(exports, require);';
		file += 'var yy = (function(exports, require) {' + source.yy + '})(exports, require);';
		file += source.parser;

		file += 'parser.yy = exports.yy; return {parse: function (code, opts) {opts = opts || {}; parser.lexer = new exports.lexer(); var root = parser.parse(code + \'\\n\');return root.compile(opts).trim();},run: function (code, opts) {opts = opts || {};parser.lexer = new exports.lexer();var root = parser.parse(code + \'\\n\');return eval(root.compile(opts).trim());}, VERSION: ' + VERSION + '};})();';
		file += 'if(typeof exports!==\'undefined\'&&typeof require!==\'undefined\'){ exports.parse = function () { return Arthur.parse.apply(Arthur,arguments); }; exports.run = function (code, opts) { opts = opts || {}; var Vm = require(\'vm\'); if (opts.sandbox instanceof Vm.Script.createContext().constructor) {var sandbox = opts.sandbox; } else { var sandbox = Vm.Script.createContext(global); sandbox.global = global; sandbox.require = require; sandbox.process = process; } Vm.runInContext(Arthur.parse(code, opts), sandbox); }; exports.VERSION = Arthur.VERSION;}';

		if (hasBeenCorrupted) {
			console.log('finished rebuilding arthur.js with basic (0.1) compiler');
			saveFile('./src/arthurBasic.js', file);
			return;
		}

		saveFile('./lib/arthur.js', file);
		// uglify('./bin/arthur.lib.js');
	}
}
