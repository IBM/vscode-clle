import assert from 'assert';
import Module from '../src/module';
import CLParser from "../src/parser";

export default {
  test1: () => {
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
  
    assert.deepStrictEqual(tokens[0], {
      value: `PGM`,
      type: `command`,
      range: {
        start: 4,
        end: 7
      }
    });
    assert.strictEqual(lines.substring(tokens[0].range.start, tokens[0].range.end), `PGM`);

    assert.deepStrictEqual(tokens[1], {
      value: `PARM`,
      type:  `parameter`,
      range: {
        start: 15,
        end: 19
      }
    });
    assert.strictEqual(lines.substring(tokens[1].range.start, tokens[1].range.end), `PARM`);

    assert.deepEqual(tokens[2], {
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

    assert.deepStrictEqual(tokens[5], {
      value: `DCL`,
      type: `command`,
      range: {
        start: 31,
        end: 34
      }
    });
    assert.strictEqual(lines.substring(tokens[5].range.start, tokens[5].range.end), `DCL`);

    assert.deepStrictEqual(tokens[6], {
      value: `VAR`,
      type: `parameter`,
      range: {
        start: 42,
        end: 45
      }
    });

    assert.deepStrictEqual(tokens[7], {
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

    assert.deepStrictEqual(tokens[8], {
      value: `TYPE`,
      type: `parameter`,
      range: {
        start: 52,
        end: 56
      }
    });

    assert.deepStrictEqual(tokens[9], {
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
    assert.strictEqual(lines.substring(tokens[9].block[0].range.start, tokens[9].block[0].range.end), `*CHAR`);

    assert.deepStrictEqual(tokens[10], {
      value: `LEN`,
      type: `parameter`,
      range: {
        start: 64,
        end: 67
      }
    });

    assert.deepStrictEqual(tokens[11], {
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

    assert.deepStrictEqual(tokens[14], {
      type: `command`,
      value: `STRPCO`,
      range: {
        start: 78,
        end: 84
      },
    });
  },

  test2: () => {
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
  
    assert.deepStrictEqual(tokens[0], {
      value: `PGM`,
      type: `command`,
      range: {
        start: 4,
        end: 7
      }
    });
    assert.strictEqual(lines.substring(tokens[0].range.start, tokens[0].range.end), `PGM`);

    assert.deepStrictEqual(tokens[1], {
      value: `PARM`,
      type:  `parameter`,
      range: {
        start: 15,
        end: 19
      }
    });
    assert.strictEqual(lines.substring(tokens[1].range.start, tokens[1].range.end), `PARM`);

    assert.deepEqual(tokens[2], {
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

    assert.deepStrictEqual(tokens[5], {
      value: `DCL`,
      type: `command`,
      range: {
        start: 31,
        end: 34
      }
    });
    assert.strictEqual(lines.substring(tokens[5].range.start, tokens[5].range.end), `DCL`);

    assert.deepStrictEqual(tokens[6], {
      value: `VAR`,
      type: `parameter`,
      range: {
        start: 42,
        end: 45
      }
    });

    assert.deepStrictEqual(tokens[7], {
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

    assert.deepStrictEqual(tokens[8], {
      value: `TYPE`,
      type: `parameter`,
      range: {
        start: 52,
        end: 56
      }
    });

    assert.deepStrictEqual(tokens[9], {
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
    assert.strictEqual(lines.substring(tokens[9].block[0].range.start, tokens[9].block[0].range.end), `*CHAR`);

    assert.deepStrictEqual(tokens[10], {
      value: `LEN`,
      type: `parameter`,
      range: {
        start: 64,
        end: 67
      }
    });

    assert.deepStrictEqual(tokens[11], {
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

    assert.deepStrictEqual(tokens[14], {
      type: `command`,
      value: `STRPCO`,
      range: {
        start: 99,
        end: 105
      },
    });

    assert.strictEqual(lines.substring(tokens[14].range.start, tokens[14].range.end), `STRPCO`);
  },

  test3: () => {
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
  
    assert.deepStrictEqual(tokens[0], {
      value: `PGM`,
      type: `command`,
      range: {
        start: 4,
        end: 7
      }
    });
    assert.strictEqual(lines.substring(tokens[0].range.start, tokens[0].range.end), `PGM`);

    assert.deepStrictEqual(tokens[1], {
      value: `PARM`,
      type:  `parameter`,
      range: {
        start: 15,
        end: 19
      }
    });
    assert.strictEqual(lines.substring(tokens[1].range.start, tokens[1].range.end), `PARM`);

    assert.deepEqual(tokens[2], {
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

    assert.deepStrictEqual(tokens[5], {
      value: `DCL`,
      type: `command`,
      range: {
        start: 31,
        end: 34
      }
    });
    assert.strictEqual(lines.substring(tokens[5].range.start, tokens[5].range.end), `DCL`);

    assert.deepStrictEqual(tokens[6], {
      value: `VAR`,
      type: `parameter`,
      range: {
        start: 42,
        end: 45
      }
    });

    assert.deepStrictEqual(tokens[7], {
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

    assert.deepStrictEqual(tokens[8], {
      value: `TYPE`,
      type: `parameter`,
      range: {
        start: 52,
        end: 56
      }
    });

    assert.deepStrictEqual(tokens[9], {
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
    assert.strictEqual(lines.substring(tokens[9].block[0].range.start, tokens[9].block[0].range.end), `*CHAR`);

    assert.deepStrictEqual(tokens[10], {
      value: `LEN`,
      type: `parameter`,
      range: {
        start: 64,
        end: 67
      }
    });

    assert.deepStrictEqual(tokens[11], {
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

    assert.deepStrictEqual(tokens[14], {
      type: `command`,
      value: `STRPCO`,
      range: {
        start: 120,
        end: 126
      },
    });

    assert.strictEqual(lines.substring(tokens[14].range.start, tokens[14].range.end), `STRPCO`);
  },

  test4: () => {
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
  
    assert.deepStrictEqual(tokens[0], {
      value: `PGM`,
      type: `command`,
      range: {
        start: 4,
        end: 7
      }
    });
    assert.strictEqual(lines.substring(tokens[0].range.start, tokens[0].range.end), `PGM`);

    assert.deepStrictEqual(tokens[1], {
      value: `PARM`,
      type:  `parameter`,
      range: {
        start: 15,
        end: 19
      }
    });
    assert.strictEqual(lines.substring(tokens[1].range.start, tokens[1].range.end), `PARM`);

    assert.deepEqual(tokens[2], {
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

    assert.deepStrictEqual(tokens[5], {
      value: `DCL`,
      type: `command`,
      range: {
        start: 31,
        end: 34
      }
    });
    assert.strictEqual(lines.substring(tokens[5].range.start, tokens[5].range.end), `DCL`);

    assert.deepStrictEqual(tokens[6], {
      value: `VAR`,
      type: `parameter`,
      range: {
        start: 42,
        end: 45
      }
    });

    assert.deepStrictEqual(tokens[7], {
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

    assert.deepStrictEqual(tokens[8], {
      value: `TYPE`,
      type: `parameter`,
      range: {
        start: 52,
        end: 56
      }
    });

    assert.deepStrictEqual(tokens[9], {
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
    assert.strictEqual(lines.substring(tokens[9].block[0].range.start, tokens[9].block[0].range.end), `*CHAR`);

    assert.deepStrictEqual(tokens[10], {
      value: `LEN`,
      type: `parameter`,
      range: {
        start: 64,
        end: 67
      }
    });

    assert.deepStrictEqual(tokens[11], {
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

    assert.deepStrictEqual(tokens[13], {
      type: `label`,
      value: `RESTART:`,
      range: {
        start: 74,
        end: 82
      },
    });
    assert.strictEqual(lines.substring(tokens[13].range.start, tokens[13].range.end), `RESTART:`);

    assert.deepStrictEqual(tokens[16], {
      type: `command`,
      value: `STRPCO`,
      range: {
        start: 130,
        end: 136
      },
    });
    assert.strictEqual(lines.substring(tokens[16].range.start, tokens[16].range.end), `STRPCO`);
  },

  test5: () => {
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
    assert.strictEqual(statements.length, 6);
    assert.strictEqual(lines.substring(
      statements[0].range.start,
      statements[0].range.end
    ), `PGM        PARM(&CMD)`);

    assert.strictEqual(lines.substring(
      statements[1].range.start,
      statements[1].range.end
    ), `DCL        VAR(&CMD) TYPE(*CHAR) LEN(128)`);

    assert.strictEqual(lines.substring(
      statements[4].range.start,
      statements[4].range.end
    ), `STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`);
  },

  test6: () => {
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
    assert.strictEqual(statements.length, 6);
    assert.strictEqual(lines.substring(
      statements[0].range.start,
      statements[0].range.end
    ), `PGM        PARM(&CMD)`);

    object = statements[0].getObject();
    assert.ok(object);
    assert.strictEqual(object.name, `PGM`);

    assert.strictEqual(lines.substring(
      statements[1].range.start,
      statements[1].range.end
    ), `DCL        VAR(&CMD) TYPE(*CHAR) +\n               LEN(128)`);
    assert.ok(statements[1].tokens.some(p => p.type === `parameter` && p.value === `LEN`));

    object = statements[1].getObject();
    assert.ok(object);
    assert.strictEqual(object.name, `DCL`);

    assert.strictEqual(lines.substring(
      statements[4].range.start,
      statements[4].range.end
    ), `STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`);

    object = statements[4].getObject();
    assert.ok(object);
    assert.strictEqual(object.name, `STRPCCMD`);
  },

  test7: () => {
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
    assert.ok(object);
    assert.strictEqual(object.name, `STRPCO`);

    assert.strictEqual(lines.substring(
      statements[4].range.start,
      statements[4].range.end
    ), `QGPL/STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`);

    object = statements[4].getObject();
    assert.ok(object);
    assert.strictEqual(object.library, `QGPL`);
    assert.strictEqual(object.name, `STRPCCMD`);
  },

  test8: () => {
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

    assert.strictEqual(statements.length, 6);

    const dcl = statements[1];
    const dcl_object = dcl.getObject();
    assert.strictEqual(dcl_object?.name, `DCL`);

    const dcl_parms = dcl.getParms();
    assert.strictEqual(Object.keys(dcl_parms).length, 3);
    assert.strictEqual(dcl_parms[`VAR`].length, 1);
    assert.strictEqual(dcl_parms[`TYPE`].length, 1);
    assert.strictEqual(dcl_parms[`LEN`].length, 1);

    assert.strictEqual(statements[2].tokens.length, 1);
    assert.strictEqual(statements[2].tokens[0].type, `label`);
  }
}