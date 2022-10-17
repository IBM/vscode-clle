import Variable from "./variable";
import File from "./file";
import Statement from "./statement";
import Subroutine from "./subroutine";

export default class Module {
  statements: (Statement|Variable|File)[];
  constructor() {
    this.statements = [];
  }

  private addStatement(statement: Statement) {
    const command = statement.getObject()?.name.toUpperCase();

    switch (command) {
      case `DCL`:
        this.statements.push(new Variable(statement.tokens, statement.range));
        break;
      case `DCLF`:
        this.statements.push(new File(statement.tokens, statement.range));
        break;
      case `SUBR`:
        this.statements.push(new Subroutine(statement.tokens, statement.range));
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

  getVariables(): Variable[] {
    return this.statements.filter(stmt => stmt.type === `variable`).map(stmt => stmt as Variable);
  }

  getVariable(name: string): Variable|undefined {
    return this.getVariables().find(def => def.name?.toUpperCase() === name.toUpperCase());
  }

  getFiles(): File[] {
    return this.statements.filter(stmt => stmt.type === `file`).map(stmt => stmt as File);
  }

  getReferences() {
    // TODO: ???
  }
}