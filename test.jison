%nonassoc "then"
%nonassoc "else"

% start Root

%%

Root
	: Chunk EOF
		{$$ = $1;}
	;

Chunk
	: Expression
		{$$ = $1;}
	| Statement
		{$$ = $1;}
	;

Block
	: TERMINATOR IND Chunks DED TERMINATOR
		{$$ = $3;}
	;

Expression
	: IF "(" IDENTIFIER ")" ":" Block			%prec "then"
		{$$ = $3;}
	| IF "(" IDENTIFIER ")" ":" Block ELSE ":" TERMINATOR IND Chunks DED
		{$$ = $3;}
	;

Statement
	: COMMENT
		{$$ = $1;}
	;