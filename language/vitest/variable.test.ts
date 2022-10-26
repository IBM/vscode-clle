import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";
import {DataType, DefinitionType} from "../src/types";

import simple_def from "./cl/simple_def";
import simple_def_two from "./cl/simple_def_two";
import many_types_ds from './cl/many_types_ds';
import Variable from '../src/variable';
import cuid from './cl/cuid';

test('getting a definiton list', () => {
  const lines = simple_def;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const definitions = module.getDefinitions();

  expect(definitions.length).toBe(1);
  
  const cmd = definitions[0] as Variable;
  expect(cmd.type).toBe(DefinitionType.Variable );
  expect(cmd.name?.value).toBe(`&CMD`);
  expect(cmd.dataType).toBe(DataType.Character);
});

test('getting a specific definiton', () => {
  const lines = simple_def;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const cmd = module.getDefinition<Variable>(`&CMD`);
  expect(cmd).toBeDefined();

  if (cmd) {
    expect(cmd.type).toBe(DefinitionType.Variable );
    expect(cmd.name?.value).toBe(`&CMD`);
    expect(cmd.dataType).toBe(DataType.Character);
  }
});

test('decimal type test', () => {
  const lines = cuid;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const cuidDef = module.getDefinition<Variable>(`&cuid`);
  expect(cuidDef).toBeDefined();

	console.log(cuidDef);

  if (cuidDef) {
    expect(cuidDef.type).toBe(DefinitionType.Variable );
    expect(cuidDef?.name?.value).toBe(`&CUID`);
    expect(cuidDef.dataType).toBe(DataType.Packed);
  }
});

test('getting a specific definiton (case-insensitive)', () => {
  const lines = simple_def;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const cmd = module.getDefinition<Variable>(`&cmd`);
  expect(cmd).toBeDefined();

  if (cmd) {
    expect(cmd.type).toBe(DefinitionType.Variable );
    expect(cmd?.name?.value).toBe(`&CMD`);
    expect(cmd.dataType).toBe(DataType.Character);
  }
});

test('getting many definitions from list', () => {
  const lines = simple_def_two;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const definitions = module.getDefinitions();
  expect(definitions.length).toBe(2);
});

test('getting different definitions by name', () => {
  const lines = simple_def_two;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const cmd = module.getDefinition<Variable>(`&cmd`);
  expect(cmd).toBeDefined();

  if (cmd) {
    expect(cmd.type).toBe(DefinitionType.Variable);
    expect(cmd.name?.value).toBe(`&CMD`);
    expect(cmd.dataType).toBe(DataType.Character);

    const cmdParms = cmd.getParms();
    const lengthParm = cmdParms[`LEN`];
    expect(lengthParm).toBeDefined();
    expect(lengthParm.length).toBe(1);
    expect(lengthParm[0].value).toBe(`128`);
  }

  const text = module.getDefinition<Variable>(`&TEXT`);
  expect(text).toBeDefined();

  if (text) {
    expect(text.type).toBe(DefinitionType.Variable );
    expect(text.name?.value).toBe(`&TEXT`);
    expect(text.dataType).toBe(DataType.Character);

    const cmdParms = text.getParms();
    const lengthParm = cmdParms[`LEN`];
    expect(lengthParm).toBeDefined();
    expect(lengthParm.length).toBe(1);
    expect(lengthParm[0].value).toBe(`256`);
  }
});

test(`shorthand declare`, () => {
  const lines = many_types_ds;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const traceDef = module.getDefinition<Variable>(`&Trace`);
  expect(traceDef).toBeDefined();
  expect(traceDef?.name?.value).toBe(`&trace`);
  expect(traceDef?.dataType).toBe(DataType.Logical);

  const qualobjDef = module.getDefinition<Variable>(`&qualobj`);
  expect(qualobjDef).toBeDefined();
  expect(qualobjDef?.name?.value).toBe(`&QualObj`);
  expect(qualobjDef?.dataType).toBe(DataType.Character);

  const objectDef = module.getDefinition<Variable>(`&Object`);
  expect(objectDef).toBeDefined();
  expect(objectDef?.name?.value).toBe(`&Object`);
  expect(objectDef?.dataType).toBe(DataType.Character);

  const libraryDef = module.getDefinition<Variable>(`&LIBRARY`);
  expect(libraryDef).toBeDefined();
  expect(libraryDef?.name?.value).toBe(`&Library`);
  expect(libraryDef?.dataType).toBe(DataType.Character);
})

test(`available types`, () => {
  const lines = many_types_ds;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const traceDef = module.getDefinition<Variable>(`&NAME`);
  expect(traceDef).toBeDefined();
  expect(traceDef?.name?.value).toBe(`&NAME`);
  expect(traceDef?.dataType).toBe(DataType.Character);

  const qualobjDef = module.getDefinition<Variable>(`&PI`);
  expect(qualobjDef).toBeDefined();
  expect(qualobjDef?.name?.value).toBe(`&PI`);
  expect(qualobjDef?.dataType).toBe(DataType.Packed);

  const objectDef = module.getDefinition<Variable>(`&trace`);
  expect(objectDef).toBeDefined();
  expect(objectDef?.name?.value).toBe(`&trace`);
  expect(objectDef?.dataType).toBe(DataType.Logical);

  const libraryDef = module.getDefinition<Variable>(`&nextobj`);
  expect(libraryDef).toBeDefined();
  expect(libraryDef?.name?.value).toBe(`&NextObj`);
  expect(libraryDef?.dataType).toBe(DataType.Pointer);
});

test('getting references', () => {
  const lines = simple_def;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const cmd = module.getDefinition<Variable>(`&CMD`);
  expect(cmd).toBeDefined();

  if (cmd) {
    const references = module.getReferences(cmd);

    expect(references.length).toBe(3);

    expect(references[0]).toMatchObject({
      start: 20,
      end: 24
    });

    expect(references[1]).toMatchObject({
      start: 46,
      end: 50
    });

    expect(references[2]).toMatchObject({
      start: 137,
      end: 141
    });
  }
});