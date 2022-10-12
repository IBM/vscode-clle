import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";
import {DataType} from "../src/types";

import def1 from "./cl/def1";
import def2 from "./cl/def2";

test('getting a definiton list', () => {
  const lines = def1;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const definitions = module.getDefinitions();

  expect(definitions.length).toBe(1);
  
  const cmd = definitions[0];
  expect(cmd.type).toBe(`definition`);
  expect(cmd.name).toBe(`&CMD`);
  expect(cmd.dataType).toBe(DataType.Character);
});

test('getting a specific definiton', () => {
  const lines = def1;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const cmd = module.getDefinition(`&CMD`);
  expect(cmd).toBeDefined();

  if (cmd) {
    expect(cmd.type).toBe(`definition`);
    expect(cmd.name).toBe(`&CMD`);
    expect(cmd.dataType).toBe(DataType.Character);
  }
});

test('getting a specific definiton (case-insensitive)', () => {
  const lines = def1;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const cmd = module.getDefinition(`&cmd`);
  expect(cmd).toBeDefined();

  if (cmd) {
    expect(cmd.type).toBe(`definition`);
    expect(cmd.name).toBe(`&CMD`);
    expect(cmd.dataType).toBe(DataType.Character);
  }
});

test('getting many definitions from list', () => {
  const lines = def2;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const definitions = module.getDefinitions();
  expect(definitions.length).toBe(2);
});

test('getting different definitions by name', () => {
  const lines = def2;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const cmd = module.getDefinition(`&cmd`);
  expect(cmd).toBeDefined();

  if (cmd) {
    expect(cmd.type).toBe(`definition`);
    expect(cmd.name).toBe(`&CMD`);
    expect(cmd.dataType).toBe(DataType.Character);

    const cmdParms = cmd.getParms();
    const lengthParm = cmdParms[`LEN`];
    expect(lengthParm).toBeDefined();
    expect(lengthParm.length).toBe(1);
    expect(lengthParm[0].value).toBe(`128`);
  }


  const text = module.getDefinition(`&TEXT`);
  expect(text).toBeDefined();

  if (text) {
    expect(text.type).toBe(`definition`);
    expect(text.name).toBe(`&TEXT`);
    expect(text.dataType).toBe(DataType.Character);
    
    const cmdParms = text.getParms();
    const lengthParm = cmdParms[`LEN`];
    expect(lengthParm).toBeDefined();
    expect(lengthParm.length).toBe(1);
    expect(lengthParm[0].value).toBe(`256`);
  }
});