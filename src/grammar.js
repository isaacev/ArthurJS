exports.grammar = {
	bnf: {
		Root: [
			['EOF', 'return new yy.Root([]);'],
			['Chunks EOF', 'return new yy.Root($1);']
		],

		Chunks: [
			['Chunk', '$$ = [$1];'],
			['Chunks TERMINATOR Chunk', '$1.push($3);'],
			'Chunks TERMINATOR'
		],

		Chunk: [
			'Expression',
			'Statement'
		],

		Expression: [
			'Assignment',
			'Value',
			'Call',
			'Operation',
			'Def',
			'If'
		],

		Statement: [
			['COMMENT', '/* ignore */'],
			'Return'
		],

		Return: [
			['RETURN', '$$ = new yy.Return();'],
			['RETURN Expression', '$$ = new yy.Return($2);']
		],

		Assignment: [
			['Assignable = Expression', '$$ = new yy.Assignment($1, $3);']
		],

		Value: [
			'Assignable',
			'Literal',
			'Parenthetical'
		],

		Call: [
			['Assignable ( )', '$$ = new yy.Call($1, []);'],
			['Assignable ( ArgList )', '$$ = new yy.Call($1, $3);']
		],

		Operation: [
			['++ Assignable', '$$ = new yy.Operation("++", $2, false);'],
			['-- Assignable', '$$ = new yy.Operation("--", $2, false);'],
			['Assignable ++', '$$ = new yy.Operation("++", $1, true);'],
			['Assignable --', '$$ = new yy.Operation("--", $1, true);'],

			['Value MATH Value', '$$ = new yy.Operation($2, $1, $3);'],
			'Comparison'
		],

		Def: [
			['DefHead IND Chunks DED', '$$ = new yy.Def($1, $3);']
		],

		DefHead: [
			['DEF : TERMINATOR', '$$ = false;'],
			['DEF ( ParamList ) : TERMINATOR', '$$ = $3;']
		],

		If: [
			['IfHead TERMINATOR', '$$ = new yy.If($1);'],
			['IfHead TERMINATOR Else', '$$ = new yy.If($1, false, $3);'],
			['IfHead TERMINATOR ElseIfs', '$$ = new yy.If($1, $3, false);'],
			['IfHead TERMINATOR ElseIfs Else', '$$ = new yy.If($1, $3, $4);'],
		],

		IfHead: [
			['IF ( Value ) : TERMINATOR IND Chunks DED', '$$ = {flag: "true", exp: $3, chunks: $8};'],
			['IF ( Comparison ) : TERMINATOR IND Chunks DED', '$$ = {exp: $3, chunks: $8};'],
		],

		ElseIfs: [
			['ElseIf', '$$ = [$1];'],
			['ElseIfs ElseIf', '$1.push($2);']
		],

		ElseIf: [
			['ELSE IF ( Value ) : TERMINATOR IND Chunks DED', '$$ = {flag: "true", exp: $4, chunks: $9};'],
			['ELSE IF ( Comparison ) : TERMINATOR IND Chunks DED', '$$ = {exp: $4, chunks: $9};']
		],

		Else: [
			['ELSE : TERMINATOR IND Chunks DED', '$$ = {chunks: $5};']
		],

		Comparisons: [
			['Comparison', '$$ = [$1];'],
			['Comparisons LOGIC Comparison', '$1.push($2, $3);']
		],

		Comparison: [
			['Expression ?', '$$ = new yy.Comparison($2, $1);'],
			['Expression LOGIC Expression', '$$ = new yy.Comparison($2, $1, $3);']
		],

		Assignable: [
			'Identifier',
			['Value Accessor', '$$ = new yy.Accessor($1, $2);'],
			['Call Accessor', '$$ = new yy.Accessor($1, $2);']
		],

		ParamList: [
			['Param', '$$ = [$1];'],
			['ParamList , Param', '$1.push($3);']
		],

		Param: [
			['Identifier', '$$ = new yy.Parameter($1, false);'],
			['Identifier = Value', '$$ = new yy.Parameter($1, $3);']
		],

		ArgList: [
			['Arg', '$$ = [$1];'],
			['ArgList , Arg', '$1.push($3);']
		],

		Arg: [
			'Value'
		],

		Accessor: [
			['[ Value ]', '$$ = $2;']
		],

		Identifier: [
			['IDENTIFIER', '$$ = new yy.Id($1);']
		],

		Literal: [
			'AlphaNumeric',
			'Array',
			'Object',
			'Boolean'
		],

		Boolean: [
			['TRUE', '$$ = new yy.Literal("boolean", $1);'],
			['FALSE', '$$ = new yy.Literal("boolean", $1);']
		],

		Parenthetical: [
			['( Expression )', '$$ = new yy.Parenthetical($2);']
		],

		AlphaNumeric: [
			['NUMBER', '$$ = new yy.Literal("number", $1);'],
			['STRING', '$$ = new yy.Literal("string", $1);']
		],

		Array: [
			['[ ]', '$$ = new yy.Array([]);'],
			['[ InlineElems ]', '$$ = new yy.Array($2);'],
			['[ TERMINATOR IND BlockElems DED TERMINATOR ]', '$$ = new yy.Array($4);']
		],

		InlineElems: [
			['Value', '$$ = [$1];'],
			['InlineElems , Value', '$1.push($3);']
		],

		BlockElems: [
			['Value', '$$ = [$1];'],
			['BlockElems TERMINATOR Value', '$1.push($3);'],
			'BlockElems TERMINATOR'
		],

		Object: [
			['{ }', '$$ = new yy.Object([]);'],
			['{ InlineProps }', '$$ = new yy.Object($2);'],
			['{ TERMINATOR IND BlockProps DED TERMINATOR }', '$$ = new yy.Object($4);']
		],

		InlineProps: [
			['Identifier = Value', '$$ = [{key: $1, val: $3}];'],
			['InlineProps , Identifier = Value', '$1.push({key: $3, val: $5});']
		],

		BlockProps: [
			['Identifier = Value', '$$ = [{key: $1, val: $3}];'],
			['BlockProps TERMINATOR Identifier = Value', '$1.push({key: $3, val: $5});'],
			'BlockProps TERMINATOR'
		]
	},

	operators: [
		// from lowest precedence to highest
		// does   foo = 4 ** 2 -> foo = Math.pow(4, 2)
		// instead of          -> Math.pow(foo = 4, 2)
		['right', 'IF', 'ELSE'],
		['right', '=', ':', 'COMPOUND_ASSIGN', 'RETURN', 'THROW', 'EXTENDS'],
		['nonassoc', 'INDENT', 'OUTDENT'],
		['left', 'LOGIC'],
		['left', 'COMPARE'],
		['left', 'RELATION'],
		['left', 'SHIFT'],
		['left', '+', '-'],
		['left', 'MATH'],
		['right', 'UNARY'],
		['left', '?'],
		['nonassoc', '++', '--'],
		['left', 'CALL_START', 'CALL_END'],
		['left', '.', '?.', '::']
	]
}