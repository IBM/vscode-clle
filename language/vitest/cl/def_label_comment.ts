export default [
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
].join(`\n`)