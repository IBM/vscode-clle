import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";
import {DataType, DefinitionType} from "../src/types";

import simple_def from "./cl/simple_def";
import simple_def_two from "./cl/simple_def_two";
import many_types_ds from './cl/many_types_ds';
import Variable from '../src/variable';

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
  expect(cmd.name).toBe(`&CMD`);
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
    expect(cmd.name).toBe(`&CMD`);
    expect(cmd.dataType).toBe(DataType.Character);
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
    expect(cmd.name).toBe(`&CMD`);
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
    expect(cmd.name).toBe(`&CMD`);
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
    expect(text.name).toBe(`&TEXT`);
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
  expect(traceDef?.name).toBe(`&trace`);
  expect(traceDef?.dataType).toBe(DataType.Logical);

  const qualobjDef = module.getDefinition<Variable>(`&qualobj`);
  expect(qualobjDef).toBeDefined();
  expect(qualobjDef?.name).toBe(`&QualObj`);
  expect(qualobjDef?.dataType).toBe(DataType.Character);

  const objectDef = module.getDefinition<Variable>(`&Object`);
  expect(objectDef).toBeDefined();
  expect(objectDef?.name).toBe(`&Object`);
  expect(objectDef?.dataType).toBe(DataType.Character);

  const libraryDef = module.getDefinition<Variable>(`&LIBRARY`);
  expect(libraryDef).toBeDefined();
  expect(libraryDef?.name).toBe(`&Library`);
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
  expect(traceDef?.name).toBe(`&NAME`);
  expect(traceDef?.dataType).toBe(DataType.Character);

  const qualobjDef = module.getDefinition<Variable>(`&PI`);
  expect(qualobjDef).toBeDefined();
  expect(qualobjDef?.name).toBe(`&PI`);
  expect(qualobjDef?.dataType).toBe(DataType.Packed);

  const objectDef = module.getDefinition<Variable>(`&trace`);
  expect(objectDef).toBeDefined();
  expect(objectDef?.name).toBe(`&trace`);
  expect(objectDef?.dataType).toBe(DataType.Logical);

  const libraryDef = module.getDefinition<Variable>(`&nextobj`);
  expect(libraryDef).toBeDefined();
  expect(libraryDef?.name).toBe(`&NextObj`);
  expect(libraryDef?.dataType).toBe(DataType.Pointer);
})