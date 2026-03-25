/*
 * MIT License
 *
 * Copyright (c) 2018-2025 R. Cozzi, Jr.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { CLSyntaxChecker } from './checker';

export function getCLCheckerUDTFSrc(schema: string, version: number) {
  return /*sql*/`
CREATE or REPLACE FUNCTION ${schema}.${CLSyntaxChecker.UDTF_NAME} (
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
     SPECIFIC ${CLSyntaxChecker.UDTF_NAME}
     EXTERNAL NAME '${schema}/${CLSyntaxChecker.PGM_NAME}'
     PARAMETER STYLE DB2SQL;


LABEL on specific routine ${schema}.${CLSyntaxChecker.UDTF_NAME} IS
'CL Command Syntax Checker via QCAPCMD API';

comment on specific FUNCTION ${schema}.${CLSyntaxChecker.UDTF_NAME} is
'${version} - CL Command Syntax Checker (QCAPCMD Wrapper)';

comment on parameter specific function ${schema}.${CLSyntaxChecker.UDTF_NAME}
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