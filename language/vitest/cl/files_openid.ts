export default [
  `PGM`,
  ``,
  `  DCLF FILE(FILE1) OPNID(A)`,
  `  DCLF FILE(FILE2) OPNID(B)`,
  ``,
  `  RCVF OPNID(A)`,
  `  RCVF OPNID(B)`,
  ``,
  `  CHGVAR VAR(&A_FIELD1) VALUE(&A_FIELD1)`,
  `  CHGVAR VAR(&B_FIELD1) VALUE(&B_FIELD1)`,
  ``,
  `ENDPGM`,
].join(`\n`);