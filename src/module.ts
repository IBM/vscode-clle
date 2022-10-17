import Definition from "./definition";
import File from "./file";
import Statement from "./statement";

export default class Module {
  statements: (Statement|Definition|File)[];
  constructor() {
    this.statements = [];
  }

  private addStatement(statement: Statement) {
    const command = statement.getObject()?.name.toUpperCase();

    switch (command) {
      case `DCL`:
        this.statements.push(new Definition(statement.tokens, statement.range));
        break;
      case `DCLF`:
        this.statements.push(new File(statement.tokens, statement.range));
        break;
      default:
        this.statements.push(statement);
        break;
    }
  }

  parseStatements(tokens: Token[]) {
    let statementIndexStart = -1;

    tokens.forEach((piece, i) => {
      if (piece.type === `newline`) {
        const before = tokens[i-1];
        if (before && before.type !== `plus`) {
          const statementTokens = tokens.slice(statementIndexStart, i);

          if (statementTokens.length > 0) {
            this.addStatement(new Statement(
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
        this.addStatement(new Statement(
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

  getDefinitions(): Definition[] {
    return this.statements.filter(stmt => stmt.type === `definition`).map(stmt => stmt as Definition);
  }

  getDefinition(name: string): Definition|undefined {
    return this.getDefinitions().find(def => def.name?.toUpperCase() === name.toUpperCase());
  }

  getFiles(): File[] {
    return this.statements.filter(stmt => stmt.type === `file`).map(stmt => stmt as File);
  }

  getReferences() {
    // TODO: ???
  }
}