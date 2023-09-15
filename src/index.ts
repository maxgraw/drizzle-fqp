import { Lexer } from "chevrotain";
import { QueryParser } from "./parser";
import { allTokens } from "./lexer";

const parser = new QueryParser();
const lexer = new Lexer([...Object.values(allTokens)], {
  ensureOptimizations: true,
});

export const parseQueryString = (text: string, type: object) => {
  const lexResult = lexer.tokenize(text);

  parser.input = lexResult.tokens;

  const result = parser.base(type);

  return {
    value: result,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
  };
};
