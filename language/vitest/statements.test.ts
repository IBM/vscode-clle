import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";

import simple_def from './cl/simple_def';
import def_label_comment from "./cl/def_label_comment";
import ex_trace from "./cl/ex_trace";
import { DefinitionType } from '../src/types';

test('test1', () => {
  const lines = simple_def;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  expect(tokens[0]).toStrictEqual({
    value: `PGM`,
    type: `command`,
    range: {
      line: 0,
      start: 4,
      end: 7
    }});

  expect(lines.substring(tokens[0].range.start, tokens[0].range.end)).toBe(`PGM`);

  expect(tokens[1]).toStrictEqual({
    value: `PARM`,
    type:  `parameter`,
    range: {
      line: 0,
      start: 15,
      end: 19
    }
  });

  expect(lines.substring(tokens[1].range.start, tokens[1].range.end)).toBe(`PARM`);

  expect(tokens[2]).toStrictEqual({
    type: `block`,
    range: {
      line: 0,
      start: 19,
      end: 25,
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        line: 0,
        start: 20,
        end: 24
      }
    }]
  });

  expect(tokens[5]).toStrictEqual({
    value: `DCL`,
    type: `command`,
    range: {
      line: 2,
      start: 31,
      end: 34
    }
  });

  expect(lines.substring(tokens[5].range.start, tokens[5].range.end)).toBe(`DCL`);

  expect(tokens[6]).toStrictEqual({
    value: `VAR`,
    type: `parameter`,
    range: {
      line: 2,
      start: 42,
      end: 45
    }
  });

  expect(tokens[7]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 45,
      end: 51
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        line: 2,
        start: 46,
        end: 50
      }
    }]
  });

  expect(tokens[8]).toStrictEqual({
    value: `TYPE`,
    type: `parameter`,
    range: {
      line: 2,
      start: 52,
      end: 56
    }
  });

  expect(tokens[9]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 56,
      end: 63
    },
    block: [{
      type: `special`,
      value: `*CHAR`,
      range: {
        line: 2,
        start: 57,
        end: 62
      }
    }]
  });

  if(tokens[9].block != undefined){
    expect(lines.substring(tokens[9].block[0].range.start, tokens[9].block[0].range.end)).toBe(`*CHAR`); 
  }

  expect(tokens[10]).toStrictEqual({
    value: `LEN`,
    type: `parameter`,
    range: {
      line: 2,
      start: 64,
      end: 67
    }
  });

  expect(tokens[11]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 67,
      end: 72
    },
    block: [{
      type: `word`,
      value: `128`,
      range: {
        line: 2,
        start: 68,
        end: 71
      }
    }]
  });

  expect(tokens[14]).toStrictEqual({
    type: `command`,
    value: `STRPCO`,
    range: {
      line: 4,
      start: 78,
      end: 84
    },
  });

})

test('test2', () => {

  const lines = [
    `    PGM        PARM(&CMD)`,
    ``,
    `    DCL        VAR(&CMD) TYPE(*CHAR) LEN(128)`,
    `    /* hello world */`,
    `    STRPCO`,
    ``,
    `    ENDPGM `,
  ].join(`\n`);

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  expect(tokens[0]).toStrictEqual({
    value: `PGM`,
    type: `command`,
    range: {
      line: 0,
      start: 4,
      end: 7
    }});

  expect(lines.substring(tokens[0].range.start, tokens[0].range.end)).toBe(`PGM`);

  expect(tokens[1]).toStrictEqual({
    value: `PARM`,
    type:  `parameter`,
    range: {
      line: 0,
      start: 15,
      end: 19
    }
  });

  expect(lines.substring(tokens[1].range.start, tokens[1].range.end)).toBe(`PARM`);

  expect(tokens[2]).toStrictEqual({
    type: `block`,
    range: {
      line: 0,
      start: 19,
      end: 25,
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        line: 0,
        start: 20,
        end: 24
      }
    }]
  });

  expect(tokens[5]).toStrictEqual({
    value: `DCL`,
    type: `command`,
    range: {
      line: 2,
      start: 31,
      end: 34
    }
  });

  expect(lines.substring(tokens[5].range.start, tokens[5].range.end)).toBe(`DCL`);

  expect(tokens[6]).toStrictEqual({
    value: `VAR`,
    type: `parameter`,
    range: {
      line: 2,
      start: 42,
      end: 45
    }
  });

  expect(tokens[7]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 45,
      end: 51
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        line: 2,
        start: 46,
        end: 50
      }
    }]
  });

  expect(tokens[8]).toStrictEqual({
    value: `TYPE`,
    type: `parameter`,
    range: {
      line: 2,
      start: 52,
      end: 56
    }
  });

  expect(tokens[9]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 56,
      end: 63
    },
    block: [{
      type: `special`,
      value: `*CHAR`,
      range: {
        line: 2,
        start: 57,
        end: 62
      }
    }]
  });

  if(tokens[9].block != undefined){
    expect(lines.substring(tokens[9].block[0].range.start, tokens[9].block[0].range.end)).toBe(`*CHAR`); 
  }

  expect(tokens[10]).toStrictEqual({
    value: `LEN`,
    type: `parameter`,
    range: {
      line: 2,
      start: 64,
      end: 67
    }
  });

  expect(tokens[11]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 67,
      end: 72
    },
    block: [{
      type: `word`,
      value: `128`,
      range: {
        line: 2,
        start: 68,
        end: 71
      }
    }]
  });

  expect(tokens[14]).toStrictEqual({
    type: `command`,
    value: `STRPCO`,
    range: {
      line: 4,
      start: 99,
      end: 105
    },
  });

  expect(lines.substring(tokens[14].range.start, tokens[14].range.end)).toBe(`STRPCO`);
})

test('test3', () => {
  const lines = [
    `    PGM        PARM(&CMD)`,
    ``,
    `    DCL        VAR(&CMD) TYPE(*CHAR) LEN(128)`,
    `    /* hello world`,
    `       goodbye world */`,
    `    STRPCO`,
    ``,
    `    ENDPGM `,
  ].join(`\n`);

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  expect(tokens[0]).toStrictEqual({
    value: `PGM`,
    type: `command`,
    range: {
      line: 0,
      start: 4,
      end: 7
    }});

  expect(lines.substring(tokens[0].range.start, tokens[0].range.end)).toBe(`PGM`);

  expect(tokens[1]).toStrictEqual({
    value: `PARM`,
    type:  `parameter`,
    range: {
      line: 0,
      start: 15,
      end: 19
    }
  });

  expect(lines.substring(tokens[1].range.start, tokens[1].range.end)).toBe(`PARM`);

  expect(tokens[2]).toStrictEqual({
    type: `block`,
    range: {
      line: 0,
      start: 19,
      end: 25,
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        line: 0,
        start: 20,
        end: 24
      }
    }]
  });

  expect(tokens[5]).toStrictEqual({
    value: `DCL`,
    type: `command`,
    range: {
      line: 2,
      start: 31,
      end: 34
    }
  });

  expect(lines.substring(tokens[5].range.start, tokens[5].range.end)).toBe(`DCL`);

  expect(tokens[6]).toStrictEqual({
    value: `VAR`,
    type: `parameter`,
    range: {
      line: 2,
      start: 42,
      end: 45
    }
  });

  expect(tokens[7]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 45,
      end: 51
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        line: 2,
        start: 46,
        end: 50
      }
    }]
  });

  expect(tokens[8]).toStrictEqual({
    value: `TYPE`,
    type: `parameter`,
    range: {
      line: 2,
      start: 52,
      end: 56
    }
  });

  expect(tokens[9]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 56,
      end: 63
    },
    block: [{
      type: `special`,
      value: `*CHAR`,
      range: {
        line: 2,
        start: 57,
        end: 62
      }
    }]
  });

  if(tokens[9].block != undefined){
    expect(lines.substring(tokens[9].block[0].range.start, tokens[9].block[0].range.end)).toBe(`*CHAR`); 
  }

  expect(tokens[10]).toStrictEqual({
    value: `LEN`,
    type: `parameter`,
    range: {
      line: 2,
      start: 64,
      end: 67
    }
  });

  expect(tokens[11]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 67,
      end: 72
    },
    block: [{
      type: `word`,
      value: `128`,
      range: {
      line: 2,
        start: 68,
        end: 71
      }
    }]
  });

  expect(tokens[14]).toStrictEqual({
    type: `command`,
    value: `STRPCO`,
    range: {
      line: 5,
      start: 120,
      end: 126
    },
  });

  expect(lines.substring(tokens[14].range.start, tokens[14].range.end)).toBe(`STRPCO`);

})

test('test4', () => {
  const lines = [
    `    PGM        PARM(&CMD)`,
    ``,
    `    DCL        VAR(&CMD) TYPE(*CHAR) LEN(128)`,
    ` RESTART:`,
    `    /* hello world`,
    `       goodbye world */`,
    `    STRPCO`,
    ``,
    `    ENDPGM `,
  ].join(`\n`);

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);

  expect(tokens[0]).toStrictEqual({
    value: `PGM`,
    type: `command`,
    range: {
      line: 0,
      start: 4,
      end: 7
    }});

  expect(lines.substring(tokens[0].range.start, tokens[0].range.end)).toBe(`PGM`);

  expect(tokens[1]).toStrictEqual({
    value: `PARM`,
    type:  `parameter`,
    range: {
      line: 0,
      start: 15,
      end: 19
    }
  });

  expect(lines.substring(tokens[1].range.start, tokens[1].range.end)).toBe(`PARM`);

  expect(tokens[2]).toStrictEqual({
    type: `block`,
    range: {
      line: 0,
      start: 19,
      end: 25,
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        line: 0,
        start: 20,
        end: 24
      }
    }]
  });

  expect(tokens[5]).toStrictEqual({
    value: `DCL`,
    type: `command`,
    range: {
      line: 2,
      start: 31,
      end: 34
    }
  });

  expect(lines.substring(tokens[5].range.start, tokens[5].range.end)).toBe(`DCL`);

  expect(tokens[6]).toStrictEqual({
    value: `VAR`,
    type: `parameter`,
    range: {
      line: 2,
      start: 42,
      end: 45
    }
  });

  expect(tokens[7]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 45,
      end: 51
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        line: 2,
        start: 46,
        end: 50
      }
    }]
  });

  expect(tokens[8]).toStrictEqual({
    value: `TYPE`,
    type: `parameter`,
    range: {
      line: 2,
      start: 52,
      end: 56
    }
  });

  expect(tokens[9]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 56,
      end: 63
    },
    block: [{
      type: `special`,
      value: `*CHAR`,
      range: {
        line: 2,
        start: 57,
        end: 62
      }
    }]
  });

  if(tokens[9].block != undefined){
    expect(lines.substring(tokens[9].block[0].range.start, tokens[9].block[0].range.end)).toBe(`*CHAR`); 
  }

  expect(tokens[10]).toStrictEqual({
    value: `LEN`,
    type: `parameter`,
    range: {
      line: 2,
      start: 64,
      end: 67
    }
  });

  expect(tokens[11]).toStrictEqual({
    type: `block`,
    range: {
      line: 2,
      start: 67,
      end: 72
    },
    block: [{
      type: `word`,
      value: `128`,
      range: {
        line: 2,
        start: 68,
        end: 71
      }
    }]
  });

  expect(tokens[13]).toStrictEqual({
    type: `label`,
    value: `RESTART:`,
    range: {
      line: 3,
      start: 74,
      end: 82
    },
  });

  expect(lines.substring(tokens[13].range.start, tokens[13].range.end)).toBe(`RESTART:`);

  expect(tokens[16]).toStrictEqual({
    type: `command`,
    value: `STRPCO`,
    range: {
      line: 6,
      start: 130,
      end: 136
    },
  });

  expect(lines.substring(tokens[16].range.start, tokens[16].range.end)).toBe(`STRPCO`);

})

test('test5', () => {
  const lines = simple_def;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);
  const module = new Module();
  module.parseStatements(tokens);

  const statements = module.statements;
  expect(statements.length).toBe(6);
  expect(lines.substring(
    statements[0].range.start,
    statements[0].range.end
  )).toBe(`PGM        PARM(&CMD)`);

  expect(lines.substring(
    statements[1].range.start,
    statements[1].range.end
  )).toBe(`DCL        VAR(&CMD) TYPE(*CHAR) LEN(128)`);

  expect(lines.substring(
    statements[4].range.start,
    statements[4].range.end
  )).toBe(`STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`);
})

test('test6', () => {
  const lines = [
    `    PGM        PARM(&CMD)`,
    ``,
    `    DCL        VAR(&CMD) TYPE(*CHAR) +`,
    `               LEN(128)`,
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

  let object;

  const statements = module.statements;
  expect(statements.length).toBe(6);
  expect(lines.substring(
    statements[0].range.start,
    statements[0].range.end
  )).toBe(`PGM        PARM(&CMD)`);

  expect(statements[0].type).toBe(DefinitionType.Statement);
  object = statements[0].getObject();
  expect(object).toBeTruthy();
  expect(object?.name).toBe(`PGM`);

  expect(statements[1].type).toBe(DefinitionType.Variable);
  expect(lines.substring(
    statements[1].range.start,
    statements[1].range.end
  )).toBe(`DCL        VAR(&CMD) TYPE(*CHAR) +\n               LEN(128)`);

  expect(statements[1].tokens.some(p => p.type === `parameter` && p.value === `LEN`)).toBeTruthy();

  object = statements[1].getObject();
  expect(object).toBeTruthy();
  expect(object?.name).toBe(`DCL`);

  expect(statements[4].type).toBe(DefinitionType.Statement);
  expect(lines.substring(
    statements[4].range.start,
    statements[4].range.end
  )).toBe(`STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`);

  object = statements[4].getObject();
  expect(object).toBeTruthy();
  expect(object?.name).toBe(`STRPCCMD`);

})

test('test7', () => {
  const lines = [
    `    PGM        PARM(&CMD)`,
    ``,
    `    DCL        VAR(&CMD) TYPE(*CHAR) +`,
    `               LEN(128)`,
    ``,
    `    STRPCO`,
    `    MONMSG     MSGID(IWS4010)`,
    ``,
    `    QGPL/STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`,
    ``,
    `    ENDPGM `,
  ].join(`\n`);

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);
  const module = new Module();
  module.parseStatements(tokens);

  let object;

  const statements = module.statements;

  expect(statements[2].type).toBe(DefinitionType.Statement);
  object = statements[2].getObject();
  expect(object).toBeTruthy();
  expect(object?.name).toBe(`STRPCO`);

  expect(lines.substring(
    statements[4].range.start,
    statements[4].range.end
  )).toBe(`QGPL/STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`);

  expect(statements[4].type).toBe(DefinitionType.Statement);
  object = statements[4].getObject();
  expect(object).toBeTruthy();
  expect(object?.library).toBe(`QGPL`);
  expect(object?.name).toBe(`STRPCCMD`);
})

test('test8', () => {
  const lines = def_label_comment;


  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);
  const module = new Module();
  module.parseStatements(tokens);

  const statements = module.statements;

  expect(statements.length).toBe(6);

  const dcl = statements[1];
  expect(dcl.type).toBe(DefinitionType.Variable);
  const dcl_object = dcl.getObject();
  expect(dcl_object?.name).toBe(`DCL`);

  const dcl_parms = dcl.getParms();
  expect(Object.keys(dcl_parms).length).toBe(3);
  expect(dcl_parms[`VAR`].block).toBeDefined();
  expect(dcl_parms[`VAR`].block?.length).toBe(1);
  expect(dcl_parms[`TYPE`].block).toBeDefined();
  expect(dcl_parms[`TYPE`].block?.length).toBe(1);
  expect(dcl_parms[`LEN`].block).toBeDefined();
  expect(dcl_parms[`LEN`].block?.length).toBe(1);

  expect(statements[2].tokens.length).toBe(1);
  expect(statements[2].tokens[0].type).toBe(`label`);
})

test('get parms on PGM', () => {
  const lines = def_label_comment;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);
  const module = new Module();
  module.parseStatements(tokens);

  const pgmDef = module.statements[0];

  expect(pgmDef).toBeDefined();
  expect(pgmDef.type).toBe(DefinitionType.Statement);

  const object = pgmDef.getObject();
  expect(object?.name).toBe(`PGM`);
  
  const parms = pgmDef.getParms();
  const parm = parms[`PARM`];
  expect(parm).toBeDefined();
  expect(parm.block).toBeDefined();
  expect(parm.block?.length).toBe(1);
  expect(parm.block![0].value).toBe(`&CMD`);
});

test('test for many parms', () => {
  const lines = def_label_comment;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);
  const module = new Module();
  module.parseStatements(tokens);

  const dclStatement = module.statements[1];

  expect(dclStatement).toBeDefined();
  expect(dclStatement.type).toBe(DefinitionType.Variable);

  const object = dclStatement.getObject();
  expect(object?.name).toBe(`DCL`);
  
  const parms = dclStatement.getParms();
  expect(parms[`VAR`]).toBeDefined();
  expect(parms[`VAR`].block).toBeDefined();
  expect(parms[`VAR`].block?.length).toBe(1);
  expect(parms[`VAR`].block![0].value).toBeDefined();

  expect(parms[`TYPE`]).toBeDefined();
  expect(parms[`TYPE`].block).toBeDefined();
  expect(parms[`TYPE`].block?.length).toBe(1);
  expect(parms[`TYPE`].block![0].value).toBeDefined();

  expect(parms[`LEN`]).toBeDefined();
  expect(parms[`LEN`].block).toBeDefined();
  expect(parms[`LEN`].block?.length).toBe(1);
  expect(parms[`LEN`].block![0].value).toBeDefined();
});

test('complex parms (ex_trace)', () => {
  const lines = ex_trace;

  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);
  const module = new Module();
  module.parseStatements(tokens);

  expect(module.statements.length).toBe(19);
  const rtvobjd = module.statements[9];
  expect(rtvobjd.type).toBe(DefinitionType.Statement);
  
  const rtvobjdObj = rtvobjd.getObject();
  expect(rtvobjdObj).toBeDefined();
  expect(rtvobjdObj?.name).toBe(`rtvobjd`);

  const rtvobjdParms = rtvobjd.getParms();
  expect(Object.keys(rtvobjdParms).length).toBe(3);

  expect(rtvobjdParms[`OBJ`]).toBeDefined();
  expect(rtvobjdParms[`OBJ`].block).toBeDefined();
  expect(rtvobjdParms[`OBJ`].block?.length).toBe(1);
  expect(rtvobjdParms[`OBJ`].block![0].type).toBe(`word`);
  expect(rtvobjdParms[`OBJ`].block![0].value).toBe(`JSONXML`);

  expect(rtvobjdParms[`OBJTYPE`]).toBeDefined();
  expect(rtvobjdParms[`OBJTYPE`].block).toBeDefined();
  expect(rtvobjdParms[`OBJTYPE`].block?.length).toBe(1);
  expect(rtvobjdParms[`OBJTYPE`].block![0].type).toBe(`special`);
  expect(rtvobjdParms[`OBJTYPE`].block![0].value).toBe(`*SRVPGM`);

  const crtdtaara = module.statements[12];
  expect(rtvobjd.type).toBe(DefinitionType.Statement);

  const crtdtaaraObj = crtdtaara.getObject();
  expect(crtdtaaraObj).toBeDefined();
  expect(crtdtaaraObj?.name).toBe(`CRTDTAARA`);

  const crtdtaaraParms = crtdtaara.getParms();
  expect(Object.keys(crtdtaaraParms).length).toBe(4);

  expect(crtdtaaraParms[`DTAARA`]).toBeDefined();
  expect(crtdtaaraParms[`DTAARA`].block).toBeDefined();
  expect(crtdtaaraParms[`DTAARA`].block?.length).toBe(3);
  expect(crtdtaaraParms[`DTAARA`].block![0].type).toBe(`variable`);
  expect(crtdtaaraParms[`DTAARA`].block![0].value).toBe(`&LIB`);
  expect(crtdtaaraParms[`DTAARA`].block![1].type).toBe(`forwardslash`);
  expect(crtdtaaraParms[`DTAARA`].block![2].type).toBe(`word`);
  expect(crtdtaaraParms[`DTAARA`].block![2].value).toBe(`SQLTRACE`);

  expect(crtdtaaraParms[`TYPE`]).toBeDefined();
  expect(crtdtaaraParms[`TYPE`].block).toBeDefined();
  expect(crtdtaaraParms[`TYPE`].block?.length).toBe(1);
  expect(crtdtaaraParms[`TYPE`].block![0].type).toBe(`special`);
  expect(crtdtaaraParms[`TYPE`].block![0].value).toBe(`*LGL`);

  expect(crtdtaaraParms[`VALUE`]).toBeDefined();
  expect(crtdtaaraParms[`VALUE`].block).toBeDefined();
  expect(crtdtaaraParms[`VALUE`].block?.length).toBe(1);
  expect(crtdtaaraParms[`VALUE`].block![0].type).toBe(`string`);
  expect(crtdtaaraParms[`VALUE`].block![0].value).toBe(`'0'`);

  expect(crtdtaaraParms[`TEXT`]).toBeDefined();
  expect(crtdtaaraParms[`TEXT`].block).toBeDefined();
  expect(crtdtaaraParms[`TEXT`].block?.length).toBe(1);
  expect(crtdtaaraParms[`TEXT`].block![0].type).toBe(`string`);
  expect(crtdtaaraParms[`TEXT`].block![0].value).toBe(`'SQL trace enabled'`);

  const rtvjoba = module.statements[15];
  expect(rtvjoba.type).toBe(DefinitionType.Statement);

  const rtvjobaObj = rtvjoba.getObject();
  expect(rtvjobaObj).toBeDefined();
  expect(rtvjobaObj?.name).toBe(`RTVJOBA`);
})

test('test with special paramater', () => {
  const lines = simple_def;

  const parser = new CLParser();
  const tokens = parser.parseDocument(`DSPOBJD OBJTYPE(*ALL) OBJ(QSYS/*ALL)`);

  const module = new Module();
  module.parseStatements(tokens);

  expect(module.statements.length).toBe(1);
  const DSPOBJD = module.statements[0];

  const parms = DSPOBJD.getParms();
  expect(Object.keys(parms).length).toBe(2);
  expect(parms[`OBJTYPE`]).toBeDefined();
  expect(parms[`OBJ`]).toBeDefined();
});