exports.grammar = {
	bnf: {
		Root: [
			['TERMINATOR', 'return new yy.Root([]);'],
			['Chunks', 'return new yy.Root($1);']
		],

		Chunks: [
			['Chunk', '$$ = [$1];'],
			['Chunks Chunk', '$1.push($2);']
		],

		Chunk: [
			['Expression TERMINATOR', '$$ = $1;'],
			['Statement TERMINATOR', '$$ = $1;']
		],

		Block: [
			['TERMINATOR IND Chunks DED', '$$ = $3;']
		],

		Expression: [
			['Value', '$$ = $1;'],
			['Operation', '$$ = $1;'],
			['Assignment', '$$ = $1;'],
			['Def', '$$ = $1;'],
			['If', '$$ = $1;'],
			['For', '$$ = $1;'],
			['While', '$$ = $1;']
		],

		Statement: [
			['COMMENT', '/* ignore */'],
			['Return', '$$ = $1;']
			['Return', '$$ = $1;'],
			['BREAK', '$$ = new yy.Break();']
		],

		Return: [
			['RETURN', '$$ = new yy.Return();'],
			['RETURN Expression', '$$ = new yy.Return($2);']
		],

		Assignment: [
			['Assignable = Expression', '$$ = new yy.Assignment(false, $1, $3);'],
			['. Identifier = Expression', '$$ = new yy.Assignment(true, $2, $4);']
		],

		Value: [
			['Call', '$$ = $1;'],
			['Assignable', '$$ = $1;'],
			['Literal', '$$ = $1;'],
			['Parenthetical', '$$ = $1;']
		],

		Call: [
			['Assignable Arguments', '$$ = new yy.Call($1, $2);'],
			['Call Arguments', '$$ = new yy.Call($1, $2);']
		],

		Arguments: [
			['( )', '$$ = [];'],
			['( ArgList )', '$$ = $2;']
		],

		ArgList: [
			['Value', '$$ = [$1];'],
			['ArgList , Value', '$1.push($3);']
		],

		Operation: [
			['++ Assignable', '$$ = new yy.Operation("++", $2, false);'],
			['-- Assignable', '$$ = new yy.Operation("--", $2, false);'],
			['Assignable ++', '$$ = new yy.Operation("++", $1, true);'],
			['Assignable --', '$$ = new yy.Operation("--", $1, true);'],
			['Math', '$$ = $1;'],
			['Comparison', '$$ = $1;']
		],

		Math: [
			['Value MATH Value', '$$ = new yy.Operation($2, $1, $3);'],
			['Math MATH Value', '$$ = new yy.Operation($2, $1, $3);']
		],

		Def: [
			['DefHead Block', '$$ = new yy.Def($1, $2);']
		],

		DefHead: [
			['DEF :', '$$ = false;'],
			['DEF ( ParamList ) :', '$$ = $3;']
		],

		ParamList: [
			['Param', '$$ = [$1];'],
			['ParamList , Param', '$1.push($3);']
		],

		Param: [
			['Identifier', '$$ = new yy.Parameter($1, false);'],
			['Identifier = Value', '$$ = new yy.Parameter($1, $3);']
		],

		If: [
			['IfBlock', '$$ = $1;', {
				prec: 'THEN'
			}],
			['IfBlock ElseIfBlocks', '$1.addElseIfs($2);'],
			['IfBlock ElseBlock', '$1.addElse($2);'],
			['IfBlock ElseIfBlocks ElseBlock', '$1.addElseIfs($2).addElse($3);']
		],

		IfBlock: [
			['IF ( Value ) : Block', '$$ = new yy.If("true", $3, $6);'],
			['IF ( Comparisons ) : Block', '$$ = new yy.If("comparison", $3, $6);']
		],

		ElseIfBlocks: [
			['ElseIf', '$$ = [$1];'],
			['ElseIfBlocks ElseIf', '$1.push($2);']
		],

		ElseIf: [
			['ELSEIF ( Value ) : Block', '$$ = {flag: "true", exp: $3, chunks: $6};'],
			['ELSEIF ( Comparisons ) : Block', '$$ = {flag: "comparison", exp: $3, chunks: $6};'],
		],

		ElseBlock: [
			['ELSE : Block', '$$ = $3;']
		],

		For: [
			['FOR ( Identifier IN Iterable ) : Block', '$$ = new yy.For($3, $5, false, $8);'],
			['FOR ( Identifier IN Iterable AS Identifier ) : Block', '$$ = new yy.For($3, $5, $7, $10);']
		],

		While: [
			['WHILE ( Comparison ) : Block', '$$ = new yy.While($3, $6);']
		],

		Iterable: [
			['Value', '$$ = $1;'],
			['Range', '$$ = $1;']
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
			['Identifier', '$$ = $1;'],
			['Value Accessor', '$$ = new yy.Accessor($1, $2);']
		],

		Accessor: [
			['. Identifier', '$$ = {type: "prop", val: $2};'],
			['[ Expression ]', '$$ = {type: "index", val: $2};']
		],

		Identifier: [
			['IDENTIFIER', '$$ = new yy.Id($1);']
		],

		Literal: [
			['AlphaNumeric', '$$ = $1;'],
			['Array', '$$ = $1;'],
			['Object', '$$ = $1;'],
			['Boolean', '$$ = $1;']
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
			['STRING', '$$ = new yy.Literal("string", $1);'],
			['REGEX', '$$ = new yy.Literal("regex", $1);']
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
			['Identifier = Expression', '$$ = [{key: $1, val: $3}];'],
			['BlockProps TERMINATOR Identifier = Expression', '$1.push({key: $3, val: $5});'],
			'BlockProps TERMINATOR'
		]
	},

	operators: [
		['nonassoc', 'ELSE', 'START', 'ROOT'],
		['nonassoc', 'THEN'],
		['left', 'LOGIC'],
		['left', '+', '-'],
		['left', 'MATH'],
		['right', 'UNARY'],
		['nonassoc', '++', '--'],
		['left', '.']
	]
};