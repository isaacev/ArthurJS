exports.test = function (describe) {
	describe('math', function (test) {
		test('add', 4, '2 + 2');
		test('subtract', 9, '11 - 2');
		test('multiply', 21, '7 * 3');
		test('divide', 1.5, '6 / 4');
		test('parentheses', 10, '4 + (3 * 2)');
		test('exponent', 16, '4 ** 2');
		test('modulo', 2, '10 % 4');
		test('+=', 6, 'foo = 2\nfoo += 4');
		test('-=', 0, 'foo = 2\nfoo -= 2');
		test('*=', 8, 'foo = 2\nfoo *= 4');
		test('/=', 1, 'foo = 2\nfoo /= 2');
	});

	describe('regex', function (test) {
		test('test', true, "/\\d+/.test('123')");
	});

	describe('string manipulation', function (test) {
		test('concatenation', 'foobar', "'foo' + 'bar'");
		test('length', 10, "'abcdefghij'.length");
	});

	describe('explicit', function (test) {
		test('number', 42, '`42`');
	});

	describe('arrays', function (test) {
		test('inline', 'three', "['one', 'two', 'three'][2]");
		test('block', 'baz', "[\n\t'foo'\n\t'bar'\n\t'baz'\n][2]");
	});

	describe('objects', function (test) {
		test('inline', 'second', "obj = {first = 1, second = 'second', third = 3}\nobj.second");
		test('block', 'uther', "obj = {\n\tking = 'arthur'\n\twizard = 'merlin'\n\tfather = 'uther'\n}\nobj.father");
	});
};
