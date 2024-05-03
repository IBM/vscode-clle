import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";
import {DataType, DefinitionType} from "../src/types";

import oldbch from "./cl/oldbch";
import Directive from '../src/directive';

test('Can parse old batch logic', () => {
  const lines = oldbch;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const definitions = module.getDefinitions();
  expect(definitions.length).toBe(0);

  expect(module.statements.length).toBe(15);

  expect(module.statements[0].type).toBe(DefinitionType.Directive);
  expect(module.statements[0].getObject()).toMatchObject({name: `BCHJOB`});
  expect((module.statements[0] as Directive).isDataDirective()).toBe(false);
  expect((module.statements[0] as Directive).hasParameters()).toBe(true);

  expect(module.statements[1].type).toBe(DefinitionType.Statement);

  // Elements 4 & 5 prove that data segments are ignored.
  expect(module.statements[4].type).toBe(DefinitionType.Directive);
  expect(module.statements[4].getObject()).toMatchObject({name: `DATA`});
  expect((module.statements[4] as Directive).isDataDirective()).toBe(true);
  expect((module.statements[4] as Directive).hasParameters()).toBe(true);

  expect(module.statements[5].type).toBe(DefinitionType.Statement);
  expect(module.statements[5].getObject()).toMatchObject({name: `CATSPLF`});

  const lastStatement = module.statements[module.statements.length - 1];
  expect(lastStatement.type).toBe(DefinitionType.Directive);
  expect(lastStatement.getObject()).toMatchObject({name: `ENDBCHJOB`});

  const directiveStatement = module.getStatementByOffset(1);
  expect(directiveStatement).toBeDefined();
  expect(directiveStatement?.type).toBe(DefinitionType.Directive);
});
