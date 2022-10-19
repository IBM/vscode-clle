import Variable from "./variable";
import File from "./file";
import Subroutine from "./subroutine";
import Statement from "./statement";
import { DefinitionType } from "./types";

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

  getDefinitions() {
    return this.statements.filter(stmt => stmt.type !== DefinitionType.Statement) as (Variable|File|Subroutine)[]
  }

  getSpecificDefinitions<T>(type: DefinitionType): T[] {
    const defs = this.getDefinitions();
    
    return defs.filter(stmt => stmt.type === type) as T[];
  }

  getDefinition<T>(name: string): T|undefined {
    const upperName = name.toUpperCase();

    const defs = this.getDefinitions();
    
    return defs.find(stmt => {
      if (stmt instanceof Variable) {
        return stmt.name?.toUpperCase() === upperName;
      }
      if (stmt instanceof File) {
        return stmt.file?.name.toUpperCase() === upperName;
      }
      if (stmt instanceof Subroutine) {
        return stmt.name?.toUpperCase() === upperName;
      }
    }) as T;
  }

  getReferences() {
    // TODO: ???
  }
}