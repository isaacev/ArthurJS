exports.grammar = {
	bnf: {
		Root: [
			['TERMINATOR EOF', 'return new yy.Root([]);'],
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

		Block: [
			['IND Chunks DED', '$$ = $2;']
		],

		Expression: [
			'Assignment',
			'Value',
			'Operation',
			'Def',
			'If',
			'For',
			'While'
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
			['Assignable = Expression', '$$ = new yy.Assignment(false, $1, $3);'],
			['. Identifier = Expression', '$$ = new yy.Assignment(true, $2, $4);'],
		],

		Value: [
			'Call',
			'Assignable',
			'Literal',
			'Parenthetical'
		],

		Call: [
			['Assignable Arguments', '$$ = new yy.Call($1, $2);'],
			['Call Arguments', '$$ = new yy.Call($1, $2);']
		],

		Arguments: [
			['( )', '$$ = [];'],
			['( ArgList )', '$$ = $2;']
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
			'IfBlock',
			'IfBlock Else'
		],

		IfBlock: [
			'IF ( Value ) : TERMINATOR Block'
		],

		Else: [
			'TERMINATOR ELSE : TERMINATOR Block'
		],

		For: [
			['FOR ( Identifier IN Iterable ) : TERMINATOR IND Chunks DED', '$$ = new yy.For($3, $5, false, $10);'],
			['FOR ( Identifier IN Iterable AS Identifier ) : TERMINATOR IND Chunks DED', '$$ = new yy.For($3, $5, $7, $12);']
		],

		While: [
			['WHILE ( Comparisons ) : TERMINATOR IND Chunks DED', '$$ = new yy.While($3, $8);']
		],

		Iterable: [
			'Value',
			'Range'
		],

		Range: [
			['{ Value .. Value }', '$$ = [$2, $4];']
		],

		Comparisons: [
			['Comparison', '$$ = [$1];'],
			['Comparisons LOGIC Comparison', '$1.push($2, $3);']
		],

		Comparison: [
			['Value ?', '$$ = new yy.Comparison($2, $1);'],
			['Value LOGIC Value', '$$ = new yy.Comparison($2, $1, $3);']
		],

		Assignable: [
			'Identifier',
			['Value Accessor', '$$ = new yy.Accessor($1, $2);']
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
			['Value', '$$ = [$1];'],
			['ArgList , Value', '$1.push($3);']
		],

		Accessor: [
			['. Identifier', '$$ = {type: "prop", val: $2};'],
			['[ Expression ]', '$$ = {type: "index", val: $2};']
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
		['left', 'Else'],
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