import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";

test('test1', () => {
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

  expect(tokens[0]).toStrictEqual({
    value: `PGM`,
    type: `command`,
    range: {
      start: 4,
      end: 7
    }});

  expect(lines.substring(tokens[0].range.start, tokens[0].range.end)).toBe(`PGM`);

  expect(tokens[1]).toStrictEqual({
    value: `PARM`,
    type:  `parameter`,
    range: {
      start: 15,
      end: 19
    }
  });

  expect(lines.substring(tokens[1].range.start, tokens[1].range.end)).toBe(`PARM`);

  expect(tokens[2]).toStrictEqual({
    type: `block`,
    range: {
      start: 19,
      end: 25,
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        start: 20,
        end: 24
      }
    }]
  });

  expect(tokens[5]).toStrictEqual({
    value: `DCL`,
    type: `command`,
    range: {
      start: 31,
      end: 34
    }
  });

  expect(lines.substring(tokens[5].range.start, tokens[5].range.end)).toBe(`DCL`);

  expect(tokens[6]).toStrictEqual({
    value: `VAR`,
    type: `parameter`,
    range: {
      start: 42,
      end: 45
    }
  });

  expect(tokens[7]).toStrictEqual({
    type: `block`,
    range: {
      start: 45,
      end: 51
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        start: 46,
        end: 50
      }
    }]
  });

  expect(tokens[8]).toStrictEqual({
    value: `TYPE`,
    type: `parameter`,
    range: {
      start: 52,
      end: 56
    }
  });

  expect(tokens[9]).toStrictEqual({
    type: `block`,
    range: {
      start: 56,
      end: 63
    },
    block: [{
      type: `special`,
      value: `*CHAR`,
      range: {
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
      start: 64,
      end: 67
    }
  });

  expect(tokens[11]).toStrictEqual({
    type: `block`,
    range: {
      start: 67,
      end: 72
    },
    block: [{
      type: `word`,
      value: `128`,
      range: {
        start: 68,
        end: 71
      }
    }]
  });

  expect(tokens[14]).toStrictEqual({
    type: `command`,
    value: `STRPCO`,
    range: {
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
      start: 4,
      end: 7
    }});

  expect(lines.substring(tokens[0].range.start, tokens[0].range.end)).toBe(`PGM`);

  expect(tokens[1]).toStrictEqual({
    value: `PARM`,
    type:  `parameter`,
    range: {
      start: 15,
      end: 19
    }
  });

  expect(lines.substring(tokens[1].range.start, tokens[1].range.end)).toBe(`PARM`);

  expect(tokens[2]).toStrictEqual({
    type: `block`,
    range: {
      start: 19,
      end: 25,
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        start: 20,
        end: 24
      }
    }]
  });

  expect(tokens[5]).toStrictEqual({
    value: `DCL`,
    type: `command`,
    range: {
      start: 31,
      end: 34
    }
  });

  expect(lines.substring(tokens[5].range.start, tokens[5].range.end)).toBe(`DCL`);

  expect(tokens[6]).toStrictEqual({
    value: `VAR`,
    type: `parameter`,
    range: {
      start: 42,
      end: 45
    }
  });

  expect(tokens[7]).toStrictEqual({
    type: `block`,
    range: {
      start: 45,
      end: 51
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        start: 46,
        end: 50
      }
    }]
  });

  expect(tokens[8]).toStrictEqual({
    value: `TYPE`,
    type: `parameter`,
    range: {
      start: 52,
      end: 56
    }
  });

  expect(tokens[9]).toStrictEqual({
    type: `block`,
    range: {
      start: 56,
      end: 63
    },
    block: [{
      type: `special`,
      value: `*CHAR`,
      range: {
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
      start: 64,
      end: 67
    }
  });

  expect(tokens[11]).toStrictEqual({
    type: `block`,
    range: {
      start: 67,
      end: 72
    },
    block: [{
      type: `word`,
      value: `128`,
      range: {
        start: 68,
        end: 71
      }
    }]
  });

  expect(tokens[14]).toStrictEqual({
    type: `command`,
    value: `STRPCO`,
    range: {
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
      start: 4,
      end: 7
    }});

  expect(lines.substring(tokens[0].range.start, tokens[0].range.end)).toBe(`PGM`);

  expect(tokens[1]).toStrictEqual({
    value: `PARM`,
    type:  `parameter`,
    range: {
      start: 15,
      end: 19
    }
  });

  expect(lines.substring(tokens[1].range.start, tokens[1].range.end)).toBe(`PARM`);

  expect(tokens[2]).toStrictEqual({
    type: `block`,
    range: {
      start: 19,
      end: 25,
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        start: 20,
        end: 24
      }
    }]
  });

  expect(tokens[5]).toStrictEqual({
    value: `DCL`,
    type: `command`,
    range: {
      start: 31,
      end: 34
    }
  });

  expect(lines.substring(tokens[5].range.start, tokens[5].range.end)).toBe(`DCL`);

  expect(tokens[6]).toStrictEqual({
    value: `VAR`,
    type: `parameter`,
    range: {
      start: 42,
      end: 45
    }
  });

  expect(tokens[7]).toStrictEqual({
    type: `block`,
    range: {
      start: 45,
      end: 51
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        start: 46,
        end: 50
      }
    }]
  });

  expect(tokens[8]).toStrictEqual({
    value: `TYPE`,
    type: `parameter`,
    range: {
      start: 52,
      end: 56
    }
  });

  expect(tokens[9]).toStrictEqual({
    type: `block`,
    range: {
      start: 56,
      end: 63
    },
    block: [{
      type: `special`,
      value: `*CHAR`,
      range: {
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
      start: 64,
      end: 67
    }
  });

  expect(tokens[11]).toStrictEqual({
    type: `block`,
    range: {
      start: 67,
      end: 72
    },
    block: [{
      type: `word`,
      value: `128`,
      range: {
        start: 68,
        end: 71
      }
    }]
  });

  expect(tokens[14]).toStrictEqual({
    type: `command`,
    value: `STRPCO`,
    range: {
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
      start: 4,
      end: 7
    }});

  expect(lines.substring(tokens[0].range.start, tokens[0].range.end)).toBe(`PGM`);

  expect(tokens[1]).toStrictEqual({
    value: `PARM`,
    type:  `parameter`,
    range: {
      start: 15,
      end: 19
    }
  });

  expect(lines.substring(tokens[1].range.start, tokens[1].range.end)).toBe(`PARM`);

  expect(tokens[2]).toStrictEqual({
    type: `block`,
    range: {
      start: 19,
      end: 25,
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        start: 20,
        end: 24
      }
    }]
  });

  expect(tokens[5]).toStrictEqual({
    value: `DCL`,
    type: `command`,
    range: {
      start: 31,
      end: 34
    }
  });

  expect(lines.substring(tokens[5].range.start, tokens[5].range.end)).toBe(`DCL`);

  expect(tokens[6]).toStrictEqual({
    value: `VAR`,
    type: `parameter`,
    range: {
      start: 42,
      end: 45
    }
  });

  expect(tokens[7]).toStrictEqual({
    type: `block`,
    range: {
      start: 45,
      end: 51
    },
    block: [{
      type: `variable`,
      value: `&CMD`,
      range: {
        start: 46,
        end: 50
      }
    }]
  });

  expect(tokens[8]).toStrictEqual({
    value: `TYPE`,
    type: `parameter`,
    range: {
      start: 52,
      end: 56
    }
  });

  expect(tokens[9]).toStrictEqual({
    type: `block`,
    range: {
      start: 56,
      end: 63
    },
    block: [{
      type: `special`,
      value: `*CHAR`,
      range: {
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
      start: 64,
      end: 67
    }
  });

  expect(tokens[11]).toStrictEqual({
    type: `block`,
    range: {
      start: 67,
      end: 72
    },
    block: [{
      type: `word`,
      value: `128`,
      range: {
        start: 68,
        end: 71
      }
    }]
  });

  expect(tokens[13]).toStrictEqual({
    type: `label`,
    value: `RESTART:`,
    range: {
      start: 74,
      end: 82
    },
  });

  expect(lines.substring(tokens[13].range.start, tokens[13].range.end)).toBe(`RESTART:`);

  expect(tokens[16]).toStrictEqual({
    type: `command`,
    value: `STRPCO`,
    range: {
      start: 130,
      end: 136
    },
  });

  expect(lines.substring(tokens[16].range.start, tokens[16].range.end)).toBe(`STRPCO`);

})

test('test5', () => {
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

  object = statements[0].getObject();
  expect(object).toBeTruthy();
  expect(object?.name).toBe(`PGM`);

  expect(lines.substring(
    statements[1].range.start,
    statements[1].range.end
  )).toBe(`DCL        VAR(&CMD) TYPE(*CHAR) +\n               LEN(128)`);

  expect(statements[1].tokens.some(p => p.type === `parameter` && p.value === `LEN`)).toBeTruthy();

  object = statements[1].getObject();
  expect(object).toBeTruthy();
  expect(object?.name).toBe(`DCL`);

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

  object = statements[2].getObject();
  expect(object).toBeTruthy();
  expect(object?.name).toBe(`STRPCO`);

  expect(lines.substring(
    statements[4].range.start,
    statements[4].range.end
  )).toBe(`QGPL/STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`);

  object = statements[4].getObject();
  expect(object).toBeTruthy();
  expect(object?.library).toBe(`QGPL`);
  expect(object?.name).toBe(`STRPCCMD`);
})

test('test8', () => {
  const lines = [
    `    PGM        PARM(&CMD)`,
    ``,
    `    DCL        VAR(&CMD) TYPE(*CHAR) LEN(128)`,
    ` RESTART:`,
    `    /* hello world`,
    `       goodbye world */`,
    `    STRPCO`,
    `    GOTO RESTART`,
    ``,
    `    ENDPGM `,
  ].join(`\n`);


  const parser = new CLParser();
  const tokens = parser.parseDocument(lines);
  const module = new Module();
  module.parseStatements(tokens);

  const statements = module.statements;

  expect(statements.length).toBe(6);

  const dcl = statements[1];
  const dcl_object = dcl.getObject();
  expect(dcl_object?.name).toBe(`DCL`);

  const dcl_parms = dcl.getParms();
  expect(Object.keys(dcl_parms).length).toBe(3);
  expect(dcl_parms[`VAR`].length).toBe(1);
  expect(dcl_parms[`TYPE`].length).toBe(1);
  expect(dcl_parms[`LEN`].length).toBe(1);

  expect(statements[2].tokens.length).toBe(1);
  expect(statements[2].tokens[0].type).toBe(`label`);

})
