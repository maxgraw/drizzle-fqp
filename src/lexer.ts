import { createToken, Lexer } from "chevrotain";

const eq = createToken({ name: "eq", pattern: /eq/ });
const and = createToken({ name: "and", pattern: /and/ });

const l_bracket = createToken({ name: "lBracket", pattern: /\(/ });
const r_bracket = createToken({ name: "rBracket", pattern: /\)/ });

const comma = createToken({ name: "Comma", pattern: /,/ });

const whitespace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

const identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z]\w*/ });

const string_literal = createToken({
  name: "StringLiteral",
  pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
});

const number_literal = createToken({
  name: "NumberLiteral",
  pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
});

const true_literal = createToken({ name: "True", pattern: /true/ });
const false_literal = createToken({ name: "False", pattern: /false/ });
const null_literal = createToken({ name: "Null", pattern: /null/ });

export const allTokens = {
  whitespace,
  eq,
  and,
  comma,
  l_bracket,
  r_bracket,
  string_literal,
  number_literal,
  true_literal,
  false_literal,
  null_literal,
  identifier,
};
