import {expect, test} from 'vitest';
import Module from '../src/module';
import File from '../src/file';
import CLParser from "../src/parser";

import file_a from './cl/file';
import file_short from './cl/file_short';
import file_var from './cl/file_var';
import { DataType, DefinitionType } from '../src/types';
import files_openid from './cl/files_openid';
import Variable from '../src/variable';

test('basic file definition', () => {
  const lines = file_a;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  expect(module.statements.length).toBe(4);

  const dclfStatement = module.statements[1];
  expect(dclfStatement.type).toBe(DefinitionType.File);

  const fileDef = dclfStatement as File;
  expect(fileDef.file).toBeDefined();
  expect(fileDef.file?.library).toBeUndefined();
  expect(fileDef.file?.name).toBe(`FILE1`);

  const fileDefOpenId = fileDef.getOpenID();
  expect(fileDefOpenId).toBeUndefined();

  const rcvfStatement = module.statements[2];
  expect(rcvfStatement.type).toBe(DefinitionType.Statement);
});

test('basic file definition with no explicit parm', () => {
  const lines = file_short;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  expect(module.statements.length).toBe(5);

  const files = module.getDefinitionsOfType<File>(DefinitionType.File);

  const fileA = files[0];
  expect(fileA.file).toBeDefined();
  expect(fileA.file?.library).toBeUndefined();
  expect(fileA.file?.name).toBe(`L012`);

  const fileB = files[1];
  expect(fileB.file).toBeDefined();
  expect(fileB.file?.library).toBe(`THELIB`);
  expect(fileB.file?.name).toBe(`L013`);

  const rcvfStatement = module.statements[3];
  expect(rcvfStatement.type).toBe(DefinitionType.Statement);
});

test('get files and vars', () => {
  const lines = file_var;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const defs = module.getDefinitionsOfType<Variable>(DefinitionType.Variable);
  const files = module.getDefinitionsOfType<File>(DefinitionType.File);

  expect(defs.length).toBe(1);
  expect(files.length).toBe(1);

  const varDef = defs[0];
  expect(varDef.name?.value).toBe(`&LOOP`);
  expect(varDef.dataType).toBe(DataType.Logical);

  const fileDef = files[0];
  expect(fileDef.file).toBeDefined();
  expect(fileDef.file?.library).toBeUndefined();
  expect(fileDef.file?.name).toBe(`FILE1`);

  const fileDefOpenId = fileDef.getOpenID();
  expect(fileDefOpenId).toBeUndefined();
});

test('many files with open id', () => {
  const lines = files_openid;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const files = module.getDefinitionsOfType<File>(DefinitionType.File);

  expect(files.length).toBe(2);

  const file1Def = files[0];
  expect(file1Def.file).toBeDefined();
  expect(file1Def.file?.library).toBeUndefined();
  expect(file1Def.file?.name).toBe(`FILE1`);

  const file1DefOpenId = file1Def.getOpenID();
  expect(file1DefOpenId).toBe(`A`)

  const file2Def = files[1];
  expect(file2Def.file).toBeDefined();
  expect(file2Def.file?.library).toBeUndefined();
  expect(file2Def.file?.name).toBe(`FILE2`);

  const file2DefOpenId = file2Def.getOpenID();
  expect(file2DefOpenId).toBe(`B`)
});
