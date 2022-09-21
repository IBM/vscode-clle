import CLParser from "./src/parser";

const parser = new CLParser();

const content = [
  `             PGM`,
  `             DCL        VAR(&MSG) TYPE(*CHAR) LEN(80)`,
  ``,
  `             DCL        VAR(&NBR1) TYPE(*DEC) LEN(15 2)`,
  `             DCL        VAR(&NBR2) TYPE(*DEC) LEN(15 2)`,
  `             DCL        VAR(&RESULT) TYPE(*DEC) LEN(15 2)`,
  ``,
  `             DCLPRCOPT  DFTACTGRP(*NO) ACTGRP(*NEW) BNDSRVPGM((IUNITS1/MATH))`,
  `             MONMSG     MSGID(CPF0000 MCH0000) EXEC(GOTO ERROR)`,
  ``,
  `             /* Test 1 - 1 */`,
  `             CHGVAR     VAR(&MSG) VALUE('Could not call Substract +`,
  `                          procedure')`,
  `             CHGVAR     VAR(&NBR1) VALUE(1)`,
  `             CHGVAR     VAR(&NBR2) VALUE(1)`,
  `             CALLPRC    PRC('SUBSTRACT') PARM((&NBR1) (&NBR2)) +`,
  `                          RTNVAL(&RESULT)`,
  `             IF         COND(&RESULT *NE 0) THEN(DO)`,
  `                CHGVAR     VAR(&MSG) VALUE('1 - 1 did not equal 0')`,
  `                goto       error`,
  `             enddo`,
  ``,
  `             /* Test 5 + 5 */`,
  `             CHGVAR     VAR(&NBR1) VALUE(5)`,
  `             CHGVAR     VAR(&NBR1) VALUE(5)`,
  `             CALLPRC    PRC('SUBSTRACT') PARM((&NBR1) (&NBR2)) +`,
  `                          RTNVAL(&RESULT)`,
  `             IF         COND(&RESULT *NE 0)  THEN(DO)`,
  `                CHGVAR     VAR(&MSG) VALUE('5 - 5 did not equal 0')`,
  `                goto       error`,
  `             enddo`,
  `             RETURN`,
  ` ERROR:`,
  `             SNDPGMMSG  MSGID(CPF9898) MSGF(QCPFMSG) MSGDTA(&MSG) MSGTYPE(*ESCAPE)`,
  `             ENDPGM `,
].join(`\r\n`);
const parts = parser.parseDocument(content);

console.log(parts);