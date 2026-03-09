export function getGenCmdXmlClSrc() {
  return `
  pgm parm(&name &cmd)
    dcl  &name     *char     10
    dcl  &cmd      *char     20
    dcl  &destinfo *char     64
    dcl  &destfmt  *char      8  value('DEST0200')
    dcl  &rcvvar   *char      1
    dcl  &rcvfmt   *char      8  value('CMDD0100')
    dcl  &error    *char     16  value(x'00000010')
    dcl  &null2    *char      2  value(x'0000')
    dcl  &null3    *char      3  value(x'000000')
    dcl  &path     *char     15
    dcl  &nmelen   *int
    dcl  &null10   *char     10  value(x'00000000000000000000')
      /*chgvar  &cmd                  value('GENDDL    *LIBL') */
    chgvar  &path                 value('/tmp/' *tcat &name)
    chgvar  &nmelen               value(10)
        
    chgvar  &nmelen value(%scan(' ' &name) - 1)
    if (&nmelen *eq -1) then(chgvar &nmelen value(10))
    chgvar  &nmelen value(5 + &nmelen) /* '/tmp/' */
        
    chgvar  %bin(&destinfo  1  4) value(0)       /* CCSID         */
    chgvar  %sst(&destinfo  5  2) value(&null2)  /* country       */
    chgvar  %sst(&destinfo  7  3) value(&null3)  /* language      */
    chgvar  %sst(&destinfo 10  3) value(&null3)  /* reserved      */
    chgvar  %bin(&destinfo 13  4) value(0)       /* path type     */
    /* path name len */
    chgvar  %bin(&destinfo 17  4) value(&nmelen)
    chgvar  %sst(&destinfo 21  2) value('/')     /* delimiter     */
    chgvar  %sst(&destinfo 23 10) value(&null10) /* reserved      */
    chgvar  %sst(&destinfo 33 32) value(&path)
    call qcdrcmdd (&cmd &destinfo &destfmt +
                    &rcvvar &rcvfmt &error)
    /*CHGAUT OBJ(&path) USER(*PUBLIC) DTAAUT(*RWX)*/
  endpgm`;
}