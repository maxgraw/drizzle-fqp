import { EmbeddedActionsParser } from "chevrotain";
import { allTokens } from "./lexer";

import { eq, and } from "drizzle-orm";

export class QueryParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  base = this.RULE("base", (type) => {
    return this.SUBRULE(this.statement, { ARGS: [type] });
  });


  statement = this.RULE("statement", (type) => {
    return this.OR([
      {
        ALT: () => {
          return this.SUBRULE(this.eqStatement, { ARGS: [type] });
        },
      },
      {
        ALT: () => {
          return this.SUBRULE(this.andStatement, { ARGS: [type] });
        },
      },
    ]);
  });

  andStatement = this.RULE("andStatement", (type) => {
    /**
     * @type {Array.<import("drizzle-orm").SQL<unknown> | undefined>}
     */
    const items = [];

    this.CONSUME(allTokens.and);
    this.CONSUME(allTokens.l_bracket);

    this.AT_LEAST_ONE_SEP({
      SEP: allTokens.comma,
      DEF: () => {
        items.push(this.SUBRULE(this.statement, { ARGS: [type] }));
      },
    })

    this.CONSUME(allTokens.r_bracket);

    return and(...items);
  });

  eqStatement = this.RULE("eqStatement", (type) => {
    this.CONSUME(allTokens.eq);
    this.CONSUME(allTokens.l_bracket);
    const identifier = this.CONSUME(allTokens.identifier);
    this.CONSUME(allTokens.comma);
    const value = this.SUBRULE(this.value);
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

  value = this.RULE("value", () => {
    return this.OR([
      {
        ALT: () => {
          const data = this.CONSUME(allTokens.string_literal);
          return data.image.substring(1, data.image.length - 1);
        },
      },
      {
        ALT: () => {
          const data = this.CONSUME(allTokens.number_literal);
          return Number(data.image);
        },
      },
      {
        ALT: () => {
          this.CONSUME(allTokens.null_literal);
          return null;
        },
      },
      {
        ALT: () => {
          this.CONSUME(allTokens.true_literal);
          return true;
        },
      },
      {
        ALT: () => {
          this.CONSUME(allTokens.false_literal);
          return false;
        },
      },
    ]);
  });
}