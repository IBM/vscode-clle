import {expect, test} from 'vitest';
import Module from '../src/module';
import File from '../src/file';
import CLParser from "../src/parser";

import file_a from './cl/file_a';

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
