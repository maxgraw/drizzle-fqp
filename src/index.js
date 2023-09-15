"use strict"

import { createToken, Lexer, EmbeddedActionsParser } from "chevrotain"

import { eq as eqDrizzle, and as andDrizzle } from "drizzle-orm";

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

const allTokens = {
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

export class QueryParser extends EmbeddedActionsParser {
    constructor() {
        super(allTokens);

        const $ = this;

        $.base = $.RULE("base", (type) => {
            let result = null;
            result = $.SUBRULE($.statement, { ARGS: [type] });

            return result;
        });

        $.statement = $.RULE("statement", (type) => {
            let result = null;
            $.OR([
                {
                    ALT: () => {
                        result = $.SUBRULE($.eqStatement, { ARGS: [type] })
                    }
                },
                {
                    ALT: () => {

                        result = $.SUBRULE($.andStatement, { ARGS: [type] })
                    }
                },
            ])

            return result;
        })

        $.andStatement = $.RULE("andStatement", (type) => {
            $.CONSUME(allTokens.and)
            $.CONSUME(allTokens.l_bracket)
            const left = $.SUBRULE($.eqStatement, { ARGS: [type] })
            $.CONSUME(allTokens.comma)
            const right = $.SUBRULE2($.eqStatement, { ARGS: [type] })
            $.CONSUME(allTokens.r_bracket);

            return andDrizzle(left, right)
        });

        $.eqStatement = $.RULE("eqStatement", (type) => {
            $.CONSUME(allTokens.eq);
            $.CONSUME(allTokens.l_bracket);
            const identifier = $.CONSUME(allTokens.identifier);
            $.CONSUME(allTokens.comma);
            const value = $.SUBRULE($.value);
            $.CONSUME(allTokens.r_bracket);

            return $.ACTION(() => {
                if (!type[identifier.image]) {
                    throw new Error(`Type does not have a field named ${identifier.image}`)
                }
                return eqDrizzle(type[identifier.image], value)
            })
        });

        $.value = $.RULE("value", () => {
            let result;
            $.OR([
                {
                    ALT: () => {
                        const data = $.CONSUME(allTokens.string_literal)
                        result = data.image.substring(1, data.image.length - 1);
                    }
                },
                {
                    ALT: () => {
                        const data = $.CONSUME(allTokens.number_literal)
                        result = Number(data.image);
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(allTokens.null_literal)
                        result = null;
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(allTokens.true_literal)
                        result = true;
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(allTokens.false_literal)
                        result = false;
                    }
                },
            ]);
            return result;
        })

        this.performSelfAnalysis();
    }
}

const parser = new QueryParser();
const lexer = new Lexer([...Object.values(allTokens)], { ensureOptimizations: true });

/**
 * Utility function to parse the query string and return drizzle orm query
 * @param {string} text 
 * @param {object} type 
 * @returns 
 */
export const parseQueryString = (text, type) => {
    const lexResult = lexer.tokenize(text);

    parser.input = lexResult.tokens;

    const result = parser.base(type);

    return {
        value: result,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors,
    }
}