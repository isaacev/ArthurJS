exports.grammar = {
	bnf: {
		Root: [
			['Chunks EOF', '$$ = $1;']
		],

		Chunks: [
			['Chunk', '$$ = [$1];'],
			['Chunks Chunk', '$1.push($2);']
		],

		Chunk: [
			['Expression', '$$ = $1;'],
			['Statement', '$$ = $1;']
		],

		Block: [
			['TERMINATOR IND Chunk DED', '$$ = $3;']
		],

		Expression: [
			['If', '$$ = $1;']
		],

		If: [
			['IfBlock', '$$ = $1;', {
				prec: 'THEN'
			}],
			['IfBlock ElseBlock', '$$ = $1;']
		],

		IfBlock: [
			['IF ( IDENTIFIER ) : Block TERMINATOR', '$$ = $3;']
		],

		ElseBlock: [
			['ELSE : TERMINATOR IND Chunk DED TERMINATOR', '$$ = $5;']
		],

		Statement: [
			['COMMENT TERMINATOR', '$$ = $1;']
		]
	},

	operators: [
		['nonassoc', 'THEN'],
		['nonassoc', 'ELSE', 'START', 'ROOT']
	]
};