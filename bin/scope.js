// Written by Arthur v1.0.0
(function() {
	exports.Scope = function () {
		var scope, temp;

		scope = [];
		temp = 0;
		this.printLocal = function () {
			var local, out, i, variable, _i, _len;

			local = scope[scope.length - 1].vars;
			if (local.length > 0) {
				out = 'var ';
				for (i = _i = 0, _len = local.length; _i < _len; i = ++_i) {
					variable = local[i];
					if (i > 0) {
						out = out + ', ';
					}
					if ((typeof variable === 'object')) {
						out = out + variable[0] + variable[1];
					} else {
						out = out + variable;
					}

				}
				return out;
			} else {
				return '';
			}

		};
		this.useVar = function (identifier) {
			var i, variable, _i, _len;

			if ((typeof identifier !== 'string')) {
				identifier = identifier.write(this);
			}
			for (i = _i = 0, _len = scope.length; _i < _len; i = ++_i) {
				variable = scope[i];
				if (variable.vars.indexOf(identifier) !== -1) {
					return;
				} else if (variable.scope.indexOf(identifier) !== -1) {
					return;
				}
			}
			this.declareVar(identifier);
		};
		this.declareVar = function (identifier, hidden) {
			if ((typeof identifier !== 'string')) {
				identifier = identifier.write(this);
			}
			if (hidden === true) {
				scope[scope.length - 1].scope.push(identifier);
			} else {
				scope[scope.length - 1].vars.push(identifier);
			}

		};
		this.exists = function (identifier) {
			var i, level, _i, _len;

			if ((typeof identifier !== 'string')) {
				identifier = identifier.write(this);
			}
			for (i = _i = 0, _len = scope.length; _i < _len; i = ++_i) {
				level = scope[i];
				if (level.vars.indexOf(identifier) !== -1) {
					return true;
				}
			}
			return false;
		};
		this.indent = function (opts) {
			if (opts === undefined || opts === null) {
				opts = {};
			}

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
	};
}).call(this);