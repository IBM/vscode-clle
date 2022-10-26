export default [
	`             /*%%TEXT Create new order with parameter */`,
	`             /*%%OBJECT-TYPE *PGM                     */`,
	`             PGM        PARM(&CUID)`,
	`             DCL        VAR(&CUID) TYPE(*DEC) LEN(5 0)`,
	`             DLTF       FILE(QTEMP/DETORD)`,
	`             MONMSG     MSGID(CPF0000)`,
	`             CRTDUPOBJ  OBJ(DETORD) FROMLIB(*LIBL) OBJTYPE(*FILE) +`,
	`                          TOLIB(QTEMP) NEWOBJ(DETORD) CST(*NO) +`,
	`                          TRG(*NO)`,
	`             OVRDBF     FILE(TMPDETORD) TOFILE(QTEMP/DETORD)`,
	`             CRTORD     CUID(&CUID)`,
	``
].join(`\n`);