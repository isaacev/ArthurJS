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
| 1 week        | Objects                        |
| 1 week        | For and While loops            |
| 1-2 weeks     | Switch/Case/Default            |
| 1-2 weeks     | Try/Catch/Finally              |
| 2 weeks       | Basic Classes and Inheiritance |
| 3 weeks       | Improved CLI                   |
| -             | 1.0 Release                    |

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

## License

Copyright &copy; 2014 Isaac Evavold

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
