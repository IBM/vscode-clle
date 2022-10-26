export default [
  `PGM`,
  `  DCL VAR(&NAME) TYPE(*CHAR) VALUE('QSYSOPR')`,
  `  DCL VAR(&PI) TYPE(*DEC) VALUE(3.14159265)`,
  `  dcl &trace       type(*lgl )`,
  ``,
  `  DCL  &QualObj     *CHAR     LEN(20)`,
  `    DCL  &Object      *CHAR     LEN(10) STG(*DEFINED) DEFVAR(&QualObj  1)`,
  `    DCL  &Library     *CHAR     LEN(10) STG(*DEFINED) DEFVAR(&QualObj 11)`,
  `  DCL  VAR(&NextObj)    TYPE(*PTR)`,
  ``,
  `  CHGVAR   VAR(%Offset(&NextObj))   VALUE(%Offset(&NextObj)+10)`,
  `ENDPGM`,
].join(`\n`);