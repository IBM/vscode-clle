import Statement from "./statement";

export default class Module {
  statements: Statement[];
  constructor() {
    this.statements = [];
  }

  parseStatements(tokens: Token[]) {
    let statementIndexStart = -1;

    tokens.forEach((piece, i) => {
      if (piece.type === `newline`) {
        const before = tokens[i-1];
        if (before && before.type !== `plus`) {
          const statementTokens = tokens.slice(statementIndexStart, i);

          if (statementTokens.length > 0) {
            this.statements.push(new Statement(
              statementTokens,
              {
                start: statementTokens[0].range.start,
                end: statementTokens[statementTokens.length-1].range.end
              }
            ));
          }

          statementIndexStart = -1;
        }
      } else
      if (statementIndexStart === -1) {
        statementIndexStart = i;
      }
    });

    if (statementIndexStart !== -1) {
      // Add remainder to statement list
      const statementTokens = tokens.slice(statementIndexStart, tokens.length);

      if (statementTokens.length > 0) {
        this.statements.push(new Statement(
          statementTokens,
          {
            start: statementTokens[0].range.start,
            end: statementTokens[statementTokens.length-1].range.end
          }
        ));
      }
    }
  }

  getStatementByIndex(index: number) {
    return this.statements.find((statement, i) => {
      const end = (this.statements[i+1] ? this.statements[i+1].range.start : statement.range.end);
      return index >= statement.range.start && index < end;
    })
  }

  getDefinition(name: string) {
    // TODO: return something?
  }

  getReferences() {
    // TODO: ???
  }
}