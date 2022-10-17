import {expect, test} from 'vitest';
import Module from '../src/module';
import File from '../src/file';
import CLParser from "../src/parser";

import file_a from './cl/file';
import file_var from './cl/file_var';
import { DataType } from '../src/types';
import files_openid from './cl/files_openid';

test('basic file definition', () => {
  const lines = file_a;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  expect(module.statements.length).toBe(4);

  const dclfStatement = module.statements[1];
  expect(dclfStatement.type).toBe(`file`);

  const fileDef = dclfStatement as File;
  expect(fileDef.file).toBeDefined();
  expect(fileDef.file?.library).toBeUndefined();
  expect(fileDef.file?.name).toBe(`FILE1`);

  const fileDefOpenId = fileDef.getOpenID();
  expect(fileDefOpenId).toBeUndefined();

  const rcvfStatement = module.statements[2];
  expect(rcvfStatement.type).toBe(`statement`);
});

test('get files and vars', () => {
  const lines = file_var;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const defs = module.getDefinitions();
  const files = module.getFiles();

  expect(defs.length).toBe(1);
  expect(files.length).toBe(1);

  const varDef = defs[0];
  expect(varDef.name).toBe(`&LOOP`);
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

  const files = module.getFiles();

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
