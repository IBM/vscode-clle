/**
 * Generates the SQL DDL used to create (or replace) the CMD_HELP UDTF in the
 * target library on IBM i.
 *
 * The version number is embedded in the LONG_COMMENT of the specific routine so
 * CmdHelpChecker.getRemoteState() can detect stale installs and trigger update().
 *
 * @author BobCozzi
 */
export function getCmdHelpSQLSrc(library: string, version: number): string {
    return `
CREATE or REPLACE FUNCTION ${library}.CMD_HELP(
                              library_name varchar(10) DEFAULT '*LIBL',
                              cmd_name     varchar(10),
                              helpid       varchar(6000) DEFAULT '*CMD'
                                             )
    RETURNS table (
            HELP_XML CLOB(16M) CCSID 1208
          )

     LANGUAGE C++
     NO SQL
     EXTERNAL ACTION
     NO FINAL CALL
     STATEMENT DETERMINISTIC
     NOT FENCED
     CARDINALITY 1
     SCRATCHPAD 256
     SPECIFIC ${library}.cmd_help
     EXTERNAL NAME '${library}/CMDHELP'
     PARAMETER STYLE DB2SQL;

LABEL on specific routine ${library}.cmd_help IS
'Retrieve helptext for a CL Command';

comment on specific function ${library}.cmd_help is
'${version} - CL Command helptext XML via QUHRHLPT API (CMDHELP program wrapper)';

comment on parameter specific function ${library}.cmd_help
(LIBRARY_NAME IS 'The name of the library where the *CMD object specified
on the CMD_NAME parameter is located. The special values *LIBL and *CURLIB
are supported. The default is *LIBL',

CMD_NAME IS 'The name of the CL command whose helptext is to be retrieved.
 Upper/lower case is ignored.',

HELPID IS 'A comma separated list of help ID whose helptext is to be
returned. This is normally a list of the command''s parameter keywords.'
);
`;
}
