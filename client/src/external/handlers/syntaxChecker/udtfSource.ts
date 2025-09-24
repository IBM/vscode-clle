export const UDTF_NAME = 'CL_SYNTAX_CHECK';
export const PGM_NAME = 'COZCLCHECK';

export function getCLCheckerUDTFSrc(schema: string, version: number) {
  return /*sql*/`
CREATE or REPLACE FUNCTION ${schema}.${UDTF_NAME} (
                                  CMD    VARCHAR(6000),
                                  CHECKOPT  VARCHAR(14) DEFAULT '*CL'
                                          )
              returns table (
                  msgid   varchar(7),
                  msgtext varchar(512),
                  cmdstring varchar(6000) -- reserved
              )
     LANGUAGE C++
     NO SQL
     NOT DETERMINISTIC
     NOT FENCED
     FINAL CALL
     DISALLOW PARALLEL
     SCRATCHPAD 8400
     SPECIFIC CODE4IBMI_CLCHECK
     EXTERNAL NAME '${schema}/${PGM_NAME}'
     PARAMETER STYLE DB2SQL;


LABEL on specific routine ${schema}.CODE4IBMI_CLCHECK IS
'CL command Syntax Check via QCAPCMD API';

comment on specific FUNCTION ${schema}.CODE4IBMI_CLCHECK is
'${version} - CL Comman Syntax Checker. QCAPCMD Wrapper by Bob Cozzi.';

comment on parameter specific function ${schema}.CODE4IBMI_CLCHECK
(
CMD is 'The CL command to be checked. A command length of up to 6000
  bytes is supported by this function',

CHECKOPT IS 'The command processing option(s). Use this parameter
to control what kind of syntax checking is performed by this function.
The valid choices are:<ul>
 <li>*CL - Syntax check the command for Command Entry syntax.</li>
 <li>*CLLE or *ILE - Syntax check an ILE CL program command</li>
 <li>*CLP - Syntax check an OPM CL program command</li>
 <li>*PDM - Syntax check with user-defined PDM substitution options.</li>
 <li>*BINDER or *BND - Syntax check a binder language command</li>
  <li>*CMD - Syntax check *CMD statements (e.g., PARM, ELEM, QUAL, etc)</li>
 <li>*LIMIT - Syntax check regular CL as limited user command.</li>
</ul>'
);`;
}