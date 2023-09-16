import { EmbeddedActionsParser } from "chevrotain";
import { allTokens } from "./lexer";

import { eq, and } from "drizzle-orm";

export class QueryParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  base = this.RULE("base", (type) => {
    return this.SUBRULE(this.#statement, { ARGS: [type] });
  });

  #statement = this.RULE("statement", (type) => {
    let result = null;
    this.OR([
      {
        ALT: () => {
          result = this.SUBRULE(this.#eqStatement, { ARGS: [type] });
        },
      },
      {
        ALT: () => {
          result = this.SUBRULE(this.#andStatement, { ARGS: [type] });
        },
      },
    ]);

    return result;
  });

  #andStatement = this.RULE("andStatement", (type) => {
    this.CONSUME(allTokens.and);
    this.CONSUME(allTokens.l_bracket);
    const left = this.SUBRULE(this.#eqStatement, { ARGS: [type] });
    this.CONSUME(allTokens.comma);
    const right = this.SUBRULE2(this.#eqStatement, { ARGS: [type] });
    this.CONSUME(allTokens.r_bracket);

    return and(left, right);
  });

  #eqStatement = this.RULE("eqStatement", (type) => {
    this.CONSUME(allTokens.eq);
    this.CONSUME(allTokens.l_bracket);
    const identifier = this.CONSUME(allTokens.identifier);
    this.CONSUME(allTokens.comma);
    const value = this.SUBRULE(this.#value);
    this.CONSUME(allTokens.r_bracket);

    return this.ACTION(() => {
      if (!type[identifier.image]) {
        throw new Error(
          `Type does not have a field named this ${identifier.image}`
        );
      }
      return eq(type[identifier.image], value);
    });
  });

  #value = this.RULE("value", () => {
    let result;
    this.OR([
      {
        ALT: () => {
          const data = this.CONSUME(allTokens.string_literal);
          result = data.image.substring(1, data.image.length - 1);
        },
      },
      {
        ALT: () => {
          const data = this.CONSUME(allTokens.number_literal);
          result = Number(data.image);
        },
      },
      {
        ALT: () => {
          this.CONSUME(allTokens.null_literal);
          result = null;
        },
      },
      {
        ALT: () => {
          this.CONSUME(allTokens.true_literal);
          result = true;
        },
      },
      {
        ALT: () => {
          this.CONSUME(allTokens.false_literal);
          result = false;
        },
      },
    ]);
    return result;
  });
}