export default [
  `PGM`,
  `  DCL VAR(&LOOP) TYPE(*LGL) VALUE('1')`,
  `  DCLF FILE(FILE1)`,
  ``,
  `  DOWHILE  COND(&LOOP)`,
  `    RCVF`,
  `    MONMSG MSGID(CPF0864) EXEC(LEAVE)`,
  `  ENDDO`,
  ``,
  `ENDPGM`,
].join(`\n`);