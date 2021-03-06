ArthurJS
========

## What?

Arthur is a language that compiles to standards compliant JavaScript using NodeJS. It uses significant-whitespace instead of curly braces to denote code blocks leader to code that is (hopefully) easier to read and more concise.

The Arthur specification is currently quite sparse and I intend to add the following features in the coming weeks:

| status        | description                    |
|:--------------|:-------------------------------|
| ✓             | Basic Math                     |
| ✓             | Assignment                     |
| ✓             | If/Else                        |
| ✓             | Functions                      |
| ✓             | Arrays                         |
| ✓             | Objects                        |
| ✓             | For and While loops            |
| ✓             | Switch/Case/Default            |
| ✓             | Try/Catch/Finally              |
| ✓             | Improved CLI                   |
| ✓             | 1.0 Release                    |
| future        | Basic Classes and Inheiritance |

## Why?

I wanted to experiment with designing a language that was built using a very consistent structure and which employed significant whitespace.

Arthur employs many of the same syntactic elements as JavaScript but with many special syntax cases replaced.

## Examples

### hello world

```
# define a function
helloWorld = def:
	return 'Hello World!'

console.log(helloWorld())
```

becomes:

```javascript
(function () {
	var helloWorld;

	helloWorld = function () {
		return 'Hello World!';
	};

	console.log(helloWorld());
}());
```

### objects and arrays

```
# inline object
obj = {foo = 'bar', baz = 123}

# inline array
arr = ['foo', 'bar', 'baz']

# block object
obj2 = {
	foo = 'bar'
	baz = 123
}

# block array
arr2 = [
	'foo'
	'bar'
	'baz'
]
```

## License

Standard MIT license
