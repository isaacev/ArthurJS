var Arthur = require('../bin/arthur.js');
var Assert = require('assert');

function compile (code) {
	return Arthur.parse(code, {
		bare: true,
		header: false
	});
}

describe('Array', function () {
	describe('#block', function () {
		it('should return formatted data', function () {
			Assert.equal('[\n\t\'foo\',\n\t\'bar\',\n\t\'baz\'\n];', compile('[\n\t\'foo\'\n\t\'bar\'\n\t\'baz\'\n]'));
		});
	});
});