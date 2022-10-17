export default [
  `    PGM        PARM(&CMD)`,
  ``,
  `    DCL        VAR(&CMD) TYPE(*CHAR) LEN(128)`,
  `    DCL        VAR(&TEXT) TYPE(*CHAR) LEN(256)`,
  ``,
  `    STRPCO`,
  `    MONMSG     MSGID(IWS4010)`,
  ``,
  `    STRPCCMD   PCCMD(&CMD) PAUSE(*YES)`,
  ``,
  `    ENDPGM `,
].join(`\n`)