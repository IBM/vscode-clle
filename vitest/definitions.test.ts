import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";
import {DataType} from "../src/types";

test('getting a simple definition', () => {
  const lines = [
    `    PGM        PARM(&CMD)`,
    ``,
    `    DCL        VAR(&CMD) TYPE(*CHAR) LEN(128)`,
    ``,
    `    STRPCO`,
    `    MONMSG     MSGID(IWS4010)`,
    ``,
    `    STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`,
    ``,
    `    ENDPGM `,
  ].join(`\n`);

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  const module = new Module();
  module.parseStatements(tokens);

  const definitions = module.getDefinitions();

  console.log(definitions);

  expect(definitions.length).toBe(1);
  
  const cmd = definitions[0];
  expect(cmd.type).toBe(`definition`);
  expect(cmd.name).toBe(`&CMD`);
  expect(cmd.dataType).toBe(DataType.Character);
})
