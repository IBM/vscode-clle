import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";
import {DataType, DefinitionType} from "../src/types";

import Subroutine from '../src/subroutine';
import zsavfcl from './cl/zsavfcl';

test('getting a subroutine list', () => {
  const lines = zsavfcl;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const definitions = module.getDefinitionsOfType<Subroutine>(DefinitionType.Subroutine);

  expect(definitions.length).toBe(2);

  const TOFILE = definitions[0];
  expect(TOFILE.name?.value).toBe(`TOFILE`);
  expect(lines.substring(
    TOFILE.range.start,
    TOFILE.range.end
  )).toBe(`SUBR       SUBR(TOFILE)`);

  const FROMFILE = definitions[1];
  expect(FROMFILE.name?.value).toBe(`FROMFILE`);
  expect(lines.substring(
    FROMFILE.range.start,
    FROMFILE.range.end
  )).toBe(`SUBR       SUBR(FROMFILE)`);
});

test('getting specific subroutine', () => {
  const lines = zsavfcl;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const FROMFILE = module.getDefinition<Subroutine>(`fromfile`);
  expect(FROMFILE).toBeDefined();

  if (FROMFILE) {
    expect(FROMFILE.name?.value).toBe(`FROMFILE`);
    expect(lines.substring(
      FROMFILE.range.start,
      FROMFILE.range.end
    )).toBe(`SUBR       SUBR(FROMFILE)`);
  }
})

test('getting specific subroutine references', () => {
  const lines = zsavfcl;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const FROMFILE = module.getDefinition<Subroutine>(`fromfile`);
  expect(FROMFILE).toBeDefined();

  if (FROMFILE) {
    const references = module.getReferences(FROMFILE);
    expect(references.length).toBe(2);

    expect(references[0]).toMatchObject({
      start: 542,
      end: 550
    });

    expect(references[1]).toMatchObject({
      start: 1019,
      end: 1027
    });
  }
})