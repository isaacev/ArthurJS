exports.Scope = function () {
	var scope = [];
	var temp = 0;
	var extensions = {};

	this.printLocal = function () {
		var local = scope[scope.length - 1].vars;

		if (local.length) {
			var out = 'var ';
			for (var i in local) {
				if (i > 0) {
					out += ', ';
				}

				if (typeof local[i] === 'object') {
					out += local[i][0] + ' = ' + local[i][1];
				} else {
					out += local[i];
				}
			}
			return out;
		} else {
			return '';
		}
	};

	this.useVar = function (identifier) {
		if (typeof identifier !== 'string') {
			identifier = identifier.write(scope);
		}

		for (var i in scope) {
			if (scope[i].vars.indexOf(identifier) !== -1) {
				return;
			} else if (scope[i].scope.indexOf(identifier) !== -1) {
				return;
			}
		}

		this.declareVar(identifier);
	};

	this.declareVar = function (identifier, hidden) {
		if (typeof identifier !== 'string') {
			identifier = identifier.write(scope);
		}

		if (hidden === true) {
			scope[scope.length - 1].scope.push(identifier);
		} else {
			scope[scope.length - 1].vars.push(identifier);
		}
	};

	this.use = function (string, alias) {
		alias = alias || false;

		var last = scope[scope.length - 1].uses;

		for (var i in last) {
			// check if global has already been used
			if (last[i][0] === string) {
				return;
			}
		}

		last.push([string, alias]);
	};

	this.printUses = function (aliases) {
		aliases = aliases || false;

		var last = scope[scope.length - 1].uses;

		var out = '';
		if (last.length) {
			for (var i in last) {
				if (i > 0) {
					out += ', ';
				}

				if (aliases && last[i][1]) {
					out += last[i][1];
				} else {
					out += last[i][0];
				}
			}

			if (!aliases) {
				out = ', [' + out + ']';
			}
		} else {
			out = '';
		}

		return out;
	};

	this.exists = function (identifier) {
		if (typeof identifier !== 'string') {
			identifier = identifier.write(scope);
		}

		for (var i = scope.length - 1; i >= 0; i--) {
			if (scope[i].vars.indexOf(identifier) !== -1) {
				return true;
			}
		}

		return false;
	};

	this.appendHelper = function (name) {
		if (Helpers[name]) {
			var helper = Helpers[name];

			scope[0].vars.push([
				'_' + name,
				helper.func
			]);

			if (helper.dependencies.length > 0) {
				for (var i in helper.dependencies) {
					this.appendHelper(helper.dependencies[i]);
				}
			}
		}
	};

	this.isInClass = function () {
		for (var i in scope) {
			if (scope[i].class !== false) {
				return scope[i].class;
			}
		}
		return false;
	};

	this.indent = function (opts) {
		opts = opts || {};

		scope.push({
			vars: [],
			scope: []
		});
	};

	this.dedent = function () {
		scope.pop();
	};

	this.indentTemp = function () {
		temp++;
	};

	this.dedentTemp = function () {
		temp--;
	};

	this.getTemp = function () {
		return temp;
	};

	this.getLevel = function () {
		return scope.length;
	};
}