import { Lexer } from "chevrotain";
import { QueryParser } from "./parser";
import { allTokens } from "./lexer";

/**
 * @typedef {object} QueryResult
 * @property {any} value
 * @property {import("chevrotain").ILexingError[]} lexErrors
 * @property {import("chevrotain").IRecognitionException[]} parseErrors
 */

const parser = new QueryParser();

const lexer = new Lexer([...Object.values(allTokens)], {
  ensureOptimizations: true,
});

/**
 * 
 * @param {string} text 
 * @param {object} type 
 * @returns {QueryResult}
 */
export const parseQueryString = (text, type) => {
  const lexResult = lexer.tokenize(text);

  parser.input = lexResult.tokens;

  const result = parser.base(type);

  return {
    value: result,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
  };
};