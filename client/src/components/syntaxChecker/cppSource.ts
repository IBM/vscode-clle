export function getCLCheckerCPPSrc() {
  return `
  // C++ processing program for QCAPCMD SQL Function
  // To compile:
  //    CRTCPPMOD MODULE(ILEDITOR/CLSYNCHECK) SRCFILE(ILEDITOR/QCSRC) SRCMBR(CLSYNCHECK)
  //    CRTPGM    PGM(ILEDITOR/CLSYNCHECK) MODULE(ILEDITOR/CLSYNCHECK)

  // be sure to replace the library with your own library name

#include <stdlib.h>
#include <except.h>
#include <signal.h>

#include <qlg.h>
#include <qlgcase.h>
#include <qlgcase.h>
#include <letype.h>
#include <lecond.h>
#include <leenv.h>
#include <qusec.h>
#include <Qp0ztrc.h>    // Qp0zLprintf
#include <QMH.h>
#include <QMHSNDPM.h>
#include <QMHRCVPM.h>
#include <QMHRTVM.h>
#include <qcapcmd.h>
// #include <CPYBYTES.MIH>

#include <unistd.h>
#include <stdio.h>
#include <errno.h>
#include <ctype.h>

#include <inttypes.h>
#include <sys/types.h>
#ifndef __POSIX_LOCALE__
#define __POSIX_LOCALE__
#endif
#include <langinfo.h>


#define _TOUPPER 0
#define _TOLOWER 1

#include <SQLUDF.h>

#include <cstring>
#include <cctype>
#include <string>
#include <memory>

#include <vector>
#include <algorithm>

using namespace std;

// Helper functions and classes

// Could not get it to compile with #include <cpybytes.mih> so I inlined it here.
#ifndef   __cpybytes_h
  #define __cpybytes_h 1

    #if (__OS400_TGTVRM__>=510)                              /* @B1A */
        #pragma datamodel(P128)                              /* @B1A */
    #endif                                                   /* @B1A */

    #ifdef __ILEC400__
      #pragma linkage( _CPYBYTES,builtin )
    #else
      extern "builtin"
    #endif

     void _CPYBYTES ( void *,           /* Receiver characters       */
                      const void *,     /* Source characters     @A1C*/
                      unsigned int );   /* Length of source          */

    #if (__OS400_TGTVRM__>=510)                              /* @B1A */
        #pragma datamodel(pop)                               /* @B1A */
    #endif                                                   /* @B1A */

#endif                                  /* #ifndef __cpybytes_h      */
// end cpybytes.mih

//  QUSEC class wrapper

#ifndef _QUSEC_T
#define _QUSEC_T
typedef struct tag_QUS_EC
 {
    union {
     int  Bytes_Provided;
     int  length;
    };
    union {
     int  Bytes_Available;
     int  Bytes_Returned;
    };
    union {
     char Exception_Id[7];
     char msgid[7];
    };
    char Reserved;   // pad char
    union {
     char Exception_Data[1000];
     char msgdta[1000];
    };
 } QUSEC_t;
#endif


class qusec
{
   public:
      qusec() { init(); }

   private:
      QUSEC_t ec;

   public:
      void setLength(size_t l) {ec.Bytes_Provided = static_cast<int>(l); }
      void clear() { memset((char*)&ec,0x00, sizeof(ec)); }
      void init()  { memset((char*)&ec,0x00, sizeof(ec)); ec.Bytes_Provided = sizeof(ec); }
      void reset() { memset((char*)&ec,0x00, sizeof(ec)); ec.Bytes_Provided = sizeof(ec); }

      int  bytesReturned() { return ec.Bytes_Available; }
      int  getLength()     { return ec.Bytes_Available; }
      int  length()        { return ec.Bytes_Available; }
      int  bytesAvail()    { return ec.Bytes_Available; }
      int  getMsgDataLen() { return (ec.Bytes_Available-16); }

      int  isEmpty()     { return (ec.Bytes_Available==0); }
      int  isNotEmpty()  { return (ec.Bytes_Available>0);  }

      int  isError()     { return (ec.Bytes_Available>0);  }
      int  isNoError()   { return (ec.Bytes_Available==0); }
      int  isNotError()  { return (ec.Bytes_Available==0); }

      int  hasError()    { return (ec.Bytes_Available>0);  }
      int  hasNoError()  { return (ec.Bytes_Available==0); }

      int  hasErrors()   { return (ec.Bytes_Available>0);  }
      int  hasNoErrors() { return (ec.Bytes_Available==0); }

      int  isNoErrors()  { return (ec.Bytes_Available==0); }

      bool compare(const char* pMsgID)
      {
          return (ec.Bytes_Available>0 && memcmp(ec.Exception_Id,pMsgID,
                         std::min<int>(strlen(pMsgID), 7)
                        )==0) ? true : false;
      }
      bool msgid(const char* pMsgID)
      {
          return (ec.Bytes_Available>0 && memcmp(ec.Exception_Id,pMsgID,
                         std::min<int>(strlen(pMsgID), 7)
                        )==0) ? true : false;
      }
      char* getMsgData(int msgOffset)
      {
        if (ec.length > 16)
        {
          ec.msgdta[ ec.length - 16 ] = 0x00;
          return ec.msgdta + msgOffset;
        }
        else return NULL;
      }
      char* getMsgData()
      {
        if (ec.length > 16)
        {
          ec.msgdta[ ec.length - 16 ] = 0x00;
          return ec.msgdta;
        }
        else return NULL;
      }
      char* getMsgID()
      {
        if (ec.length >= 16)
        {
          return ec.Exception_Id;
        }
        else return NULL;
      }
      char* msgid()
      {
        if (ec.length >= 16)
        {
          return ec.Exception_Id;
        }
        else return NULL;
      }
      char* msgdata()
      {
        if (ec.length > 16)
        {
          ec.msgdta[ ec.length - 16 ] = 0x00;
          return ec.msgdta;
        }
        else return NULL;
      }

      operator void*() {
        return static_cast<void*>(&ec);
      }
      operator Qus_EC_t*() {
        return (Qus_EC_t*)&ec;
      }
      operator QUSEC_t*() {
        return &ec;
      }
};


bool startsWith(const char* str, const char* prefix) {
    return strncmp(str, prefix, std::strlen(prefix)) == 0;
}

int makeUpper(char* szData, int inLen = 0, int ccsid = 0)
{

  Qlg_CCSID_ReqCtlBlk_T frcb;
  qusec      ec;
  long       len = 0;
  char*      pIn = szData;
  char*      pOut= szData;

  memset((char*)&frcb,0x00,sizeof(frcb));
  frcb.Type_of_Request = 1;
  frcb.Case_Request = _TOUPPER;
  frcb.CCSID_of_Input_Data = ccsid;

  if (inLen <= 0)
  {
    len = strlen(pIn);
  }
  else
  {
    len = inLen;
  }

  ec.init();
  if (len > 0)
  {
    QlgConvertCase( (char*) &frcb, (char*)pIn,
                     pOut, &len ,
                    (char*) &ec);
  }
  return len;
}


int makeLower(char* szData, int inLen = 0, int ccsid = 0)
{

  Qlg_CCSID_ReqCtlBlk_T frcb;
  qusec ec;
  long       len = 0;
  char*      pIn = szData;
  char*      pOut= szData;

  memset((char*)&frcb,0x00,sizeof(frcb));
  frcb.Type_of_Request = 1;
  frcb.Case_Request = _TOLOWER;  // 0=Upper 1=Lower
  frcb.CCSID_of_Input_Data = ccsid;

  if (inLen <= 0)
  {
    len = strlen(pIn);
  }
  else
  {
    len = inLen;
  }

  ec.init();
  if (len > 0)
  {
    QlgConvertCase( (char*) &frcb, (char*)pIn,
                     pOut, &len ,
                    (char*) &ec);
  }
  return len;
}



char* getNextParmIf( int& pC, int& argc, char** argv, int clearBuffSize = 0)
{
   char* pRtn = NULL;
   if (argc > pC+1)
   {
      pRtn = argv[++pC];
      if (clearBuffSize > 0)   // clear buffer? Then clear prior data (if any)
      {
        memset(pRtn, 0x00, clearBuffSize);
      }
   }
   return pRtn;
}
#define inParm(_v)       char  *in##_v = (char *)getNextParmIf(p, argc, argv, 0)
#define outParm(_v)      char  *out##_v = (char *)getNextParmIf(p, argc, argv, 1)
#define inIndy(_v)       short *indyIn##_v = (short *)getNextParmIf(p, argc, argv, 0)
#define outIndy(_v)      short *indy##_v = (short *)getNextParmIf(p, argc, argv, 2)

#define cpyFixedToStr(dest, src, srclen)        \
    do {                                        \
        size_t i_copy = 0;                      \
        for (; i_copy < (srclen); ++i_copy) {   \
            if ((src)[i_copy] == '\0') break;   \
            (dest)[i_copy] = (src)[i_copy];     \
        }                                       \
        (dest)[i_copy] = '\0';                  \
    } while (0)

#define copyPad(_t, _s) \
 memset(_t, 0x00, sizeof(_t)); \
 memset(_t, ' ', sizeof(_t)-1); \
 _CPYBYTES(_t, _s, std::min<int>(sizeof(_t)-1,strlen(_s)))

#define makeAPIObjName(_out, _obj, _lib) \
 memset(_out, ' ', 10); \
 _CPYBYTES(_out, _obj, strlen(_obj)); \
 memset(_out+10, ' ', 10); \
 _CPYBYTES(_out+10, _lib, strlen(_lib))


int getNextSyntaxErrorMsg(char* msgkey, char* msgid, char* msgtext);
int xlateCheckOption(const char* pCheckOption);

    // Prototype for retrieve Message text
void rtvMsgText(char* pMsgText, int bufLen, qusec& ec);

#define MAX_MSG_ENTRIES 16  // Limit to 16 syntax error message (rarely more than 8)
#define MAXMSGTEXT_LEN 512  // Limit message text to the first 1/2k of data

typedef struct tagMsgEntry_t {
    char msgid[7];
    char msgtext[MAXMSGTEXT_LEN+1];
} msgentry_t;


typedef _Packed struct tagScratch
{
    int len;  // scratch pad length as set by the SCRATCHPAD kwd in the UDTF
    int eof;
    int msgCount;
    int msgIndex;
    msgentry_t msg[MAX_MSG_ENTRIES]; // Array of message entries
} scratch_t;

int main(int argc, char *argv[])
{
     /**********************************************************/
     /* Syntax Check CL Commands via an SQL Fuction            */
     /**********************************************************/

     int p = 0;

     //////////////////////////////////////////////
     //  INPUT Parameters
     //////////////////////////////////////////////
     inParm(CMD);
     inParm(CHECKOPT);

     //////////////////////////////////////////////
     //  OUTPUT Parameters
     //////////////////////////////////////////////
     outParm(MSGID);
     outParm(MSGTEXT);   // Future objective to create full resulting message text
     outParm(CMD);       // Output reformatted command for pre-prompting OPTION(*PMT)

     //////////////////////////////////////////////
     //  Input Indicator Fields
     //////////////////////////////////////////////
     inIndy(CMD);
     inIndy(CHECKOPT);
        // Options may be any 1 of the following:
        // Note upper/lower case and leading asterisk are ignored.
        //   NULL or empty = Command Entry (non-program) CL (default)
        //   *CL   - Command Entry (non-program) CL
        //   *CLLE - ILE CL Program syntax
        //   *CLP  - OPM CL Program syntax
        //   *LIMIT - Limited User Commands
        //   *CMD  - Command Definition Commands
        //   *BND  - Binder Language Commands

     //////////////////////////////////////////////
     //  Output Indicator Fields
     //////////////////////////////////////////////
    outIndy(MSGID);   // set to 0 by the macro
    outIndy(MSGTEXT);    // set to 0 by the macro
    outIndy(CMD);        // set to 0 by the macro

     ////////////////////////////////////////////////////////////
     //  SQL specific parameters
     ////////////////////////////////////////////////////////////
     char *sqlstate     = (char *)getNextParmIf(p, argc, argv);
     char *funcName     = (char *)getNextParmIf(p, argc, argv);
     char *specificName = (char *)getNextParmIf(p, argc, argv);
     char *sqlmsgtext   = (char *)getNextParmIf(p, argc, argv);
     char *scratchPad   = (char *)getNextParmIf(p, argc, argv);
     int  *sqlOpCode    = (int  *)getNextParmIf(p, argc, argv);

     ////////////////////////////////////////////////////////////
     //  BEGIN main() body (after parms starts here)
     ////////////////////////////////////////////////////////////

     scratch_t* pScratch = (scratch_t *)scratchPad;
      const int            MSGTEXT_LEN = 1024;
      char                 APIFMT[] = "CPOP0100";
      int                  ctlType = 0;
      int                  ctlInv = 0;

      _FEEDBACK            fc;
      qusec           ec;

       if (*sqlOpCode == SQLUDF_TF_OPEN)
       {
           int len = pScratch->len; // save scratchpad length
           memset(pScratch,0x00, sizeof(scratchPad));
           pScratch->len = len; // restore scratchpad length

      Qca_PCMD_CPOP0100_t  ctrlBlock;
      int                  ctrlBlockLen = sizeof(ctrlBlock);

     memset((char*)&ctrlBlock,0x00,sizeof(ctrlBlock));

     ctrlBlock.Command_Process_Type = 0;     // DFT: Mimic QCMDEXC
     ctrlBlock.DBCS_Data_Handling = '0';     // 0 = Ignore DBCS, 1 = Handle DBCS
     ctrlBlock.Prompter_Action = '0';        // 0 = Never prompt the command
     ctrlBlock.Command_String_Syntax = '0';  // 0 = IBM i syntax, 1 = System/38
     memset(ctrlBlock.Message_Key,' ', sizeof(ctrlBlock.Message_Key));
     ctrlBlock.CCSID_Command_String = 0;

     const int MAXCMD_LEN = 6000;           // Min updated CMD string area
     const int MINCMD_BUFLEN = 1024;
     int cmdLen = strlen(inCMD);   // Input CMD string length
     while (cmdLen > 0 && inCMD[cmdLen-1] == ' ') --cmdLen;

      // Calculate length for updated CMD string workspace
     int  rtnUpdatedCmdLen = 0;
     int  returnedCmdBufferLen = MAXCMD_LEN;
     int  syntaxOption = 0;
     char returnedCmdString[MAXCMD_LEN];
     char* pRtnCmd = returnedCmdString;

     ctrlBlock.Command_Process_Type = 3;  // DFT(Command Entry Syntax checking)
     if (*indyInCHECKOPT >= 0 && strlen(inCHECKOPT) > 0)
     {
        while (*inCHECKOPT == ' ' || *inCHECKOPT == '*') {
               ++inCHECKOPT;
        }
        char cmdCheckOption[64];
        strcpy(cmdCheckOption, inCHECKOPT);
        makeUpper(cmdCheckOption);

        syntaxOption = xlateCheckOption(cmdCheckOption);

        ctrlBlock.Command_Process_Type = syntaxOption;

      }
      const char lf = 0x25;
      Qp0zLprintf("[CLSYNCHECK] Using CL Syntax Check Option %s Process Type: %d %c",
                   inCHECKOPT,
                   ctrlBlock.Command_Process_Type,
                   lf);


#pragma exception_handler(MONMSG, 0, 0, _C2_MH_ESCAPE | _C2_MH_FUNCTION_CHECK,\
                          _CTLA_HANDLE )

      ec.init();
        // RUN CL Command using QCAPCMD
      QCAPCMD(inCMD,
              cmdLen,
              &ctrlBlock,
              ctrlBlockLen,
              APIFMT,
              returnedCmdString,
              returnedCmdBufferLen,
              &rtnUpdatedCmdLen,
              &ec);

MONMSG:
      if (*indyCMD >= 0 && ctrlBlock.Command_Process_Type == 10)
      {
         returnedCmdString[rtnUpdatedCmdLen] = 0x00;
         strcpy(outCMD, returnedCmdString);
      }

#pragma disable_handler
CONTINUE:
      if (ec.hasNoErrors())  // Ignored if no MSGID parm passed in
      {
        pScratch->eof = 1;
        strcpy(sqlstate,"02000");
        return 0;
      }
      // save the general "there was a syntax error" msg as msgid[0] and send/return last
      cpyFixedToStr(pScratch->msg[pScratch->msgCount].msgid, ec.msgid(), 7);
      rtvMsgText(pScratch->msg[pScratch->msgCount].msgtext, MAXMSGTEXT_LEN, ec);
      pScratch->msgCount++;

      // Load all (any?) syntax error messages into Scratchpad (upto 16 are supported, currently)
      char msgkey[4];
      memset(msgkey, 0x00, sizeof(msgkey));

      while (getNextSyntaxErrorMsg(msgkey, pScratch->msg[pScratch->msgCount].msgid, pScratch->msg[pScratch->msgCount].msgtext))
      {
        pScratch->msgCount++;
      }
      if (pScratch->msgCount==0)
      {
        pScratch->eof = 1;
        strcpy(sqlstate,"02000");
        return 0;
      }
      else {
        pScratch->msgIndex = 1;  // Start at first index (not 0) if any
      }

    }  // end SQLUDF_TF_OPEN

    if (pScratch->eof != 0) {
      strcpy(sqlstate,"02000");
    }
      // SQLUDF_TF_FETCH  - F E T C H
    if (*sqlOpCode == SQLUDF_TF_FETCH)
    {
         *indyCMD =  -1;
         outCMD[0] = 0x00;

        if (pScratch->msgIndex!=0 && pScratch->msgIndex < pScratch->msgCount)
        {
            cpyFixedToStr(outMSGID, pScratch->msg[pScratch->msgIndex].msgid, 7);
            strcpy(outMSGTEXT, pScratch->msg[pScratch->msgIndex].msgtext);
            pScratch->msgIndex++;
        }
        else if (pScratch->msgIndex >= pScratch->msgCount)
        {
            cpyFixedToStr(outMSGID, pScratch->msg[0].msgid, 7);
            strcpy(outMSGTEXT, pScratch->msg[0].msgtext);
            pScratch->msgIndex=0;
        }
        else
        {
          pScratch->eof = 1;
          strcpy(sqlstate,"02000");
          return 0;
        }
    }

}  // end main

int xlateCheckOption(const char* pCheckOption)
{
    int typeCheck = 3;  // Default to non-CL Program CL Commands (i.e., Command Entry commands)

      // Setup up type of syntax checking to perform
      // RC: Change this first compare from startsWith to strcmp
  if (
      strcmp(pCheckOption,"CHECK")==0  ||
      strcmp(pCheckOption,"CHK")==0    ||
      strcmp(pCheckOption,"CLCHECK")==0   ||
      strcmp(pCheckOption,"SYNTAX")==0    ||
      strcmp(pCheckOption,"CLSYNTAX")==0  ||
      strcmp(pCheckOption,"QCMDCHECK")==0 ||
      strcmp(pCheckOption,"QCMDEXEC")==0  ||
      strcmp(pCheckOption,"QCMDCHK")==0)
  {
      typeCheck = 1;     // 1=Command Entry CL Syntax check (syntax check any CL command)  s
  }
  else if (startsWith(pCheckOption,"LMT") ||  // *LMTUSER
           startsWith(pCheckOption,"LIMIT"))  // *LIMITTED
  {
      typeCheck = 2; // Command Line environment: Run
  }
         // DEFAULT CHECKOPT
  else if (strcmp(pCheckOption,"CL")==0        ||
           strcmp(pCheckOption,"RUN")==0       ||
           startsWith(pCheckOption,"CMDENTRY") ||
           startsWith(pCheckOption,"CMDLINE")  ||
           startsWith(pCheckOption,"QCMDLINE") ||
           startsWith(pCheckOption,"LINE"))
  {
      typeCheck = 3; // Command Line environment: Syntax Check Only
  }
  else if (startsWith(pCheckOption,"CLP")   ||  // *CLP
           startsWith(pCheckOption,"OPM")   ||  // *CLPGM
           startsWith(pCheckOption,"CLPGM"))    // *PGM
  {
      typeCheck = 4; // Syntax Check CL Program statement
  }
  else if (startsWith(pCheckOption,"CMD"))   // *CMD
  {
      typeCheck = 6;  // Command definition statements
  }
  else if (startsWith(pCheckOption,"BND")   ||  // *CLP
           startsWith(pCheckOption,"BIND"))      // *PGM
  {
      typeCheck = 7; // Binder Language CL command Syntax Check
  }
  else if (startsWith(pCheckOption,"PDM")   ||  // *CLP
            startsWith(pCheckOption,"USRDFN") ||  // *CLPGM
            startsWith(pCheckOption,"USERDEFN"))      // *PGM
  {
      typeCheck = 8; // Syntax Check CL Program statement
  }
  else if (startsWith(pCheckOption,"CLLE")   ||  // *CLP
           startsWith(pCheckOption,"ILECL") ||  // *CLPGM
           startsWith(pCheckOption,"ILE"))      // *PGM  or *ILEPGM or *ILECLPGM
  {
      typeCheck = 9; // Syntax Check CL Program statement
  }
  else if (startsWith(pCheckOption,"PMT")   ||  // *PMT
           startsWith(pCheckOption,"PROMPT"))  // *PROMPTER
  {   // 10 is prep for prompting.
      typeCheck = 10; // Syntax Check CL Program statement
  }
  return typeCheck;
}

void rtvMsgText(char* pMsgText, int bufLen, qusec& ec)
{
   char msgfile[21];
   char msgPrefix[3];

   Qus_EC_t  fc;
   memset((char*)&fc, 0x00, sizeof(fc));
   fc.Bytes_Provided = sizeof(fc);
   fc.Bytes_Available = sizeof(fc);


   if (ec.isEmpty())
   {
       return;
   }

   _CPYBYTES(msgPrefix, ec.msgid(), 2);
   msgPrefix[2] = 0x00;

   if (strcmp(msgPrefix,"CP")==0)
   {
      makeAPIObjName(msgfile,"QCPFMSG","*LIBL");
   }
   else if (strcmp(msgPrefix,"RN")==0)
   {
      makeAPIObjName(msgfile,"QRPGLEMSG","QDEVTOOLS");
   }
   else if (strcmp(msgPrefix,"HT")==0)
   {
      makeAPIObjName(msgfile,"QHTTPMSG","QHTTPSVR");
   }
   else if (strcmp(msgPrefix,"CE")==0)
   {
      makeAPIObjName(msgfile,"QCEEMSG","QSYS");
   }
   else if (strcmp(msgPrefix,"GU")==0)
   {
      makeAPIObjName(msgfile,"QGUIMSG","QSYS");
   }
   else if (strcmp(msgPrefix,"IW")==0)
   {
      makeAPIObjName(msgfile,"QIWSMSG","QSYS");
   }
      char APIFMT[9] = "RTVM0100";
      char includeMSGDATA[11];
      char fmtCTL[11];
      char msgid[8];
      char* pMsgData = ec.msgdata();
      int  msgDataLen = ec.getMsgDataLen();
      char buffer[4096];

      memset(pMsgText,0x00, bufLen);
      memset(buffer,0x00, sizeof(buffer));
      copyPad(includeMSGDATA,"*YES");
      copyPad(fmtCTL,"*NO");
      cpyFixedToStr(msgid,ec.msgid(),7);

     QMHRTVM(buffer,
             sizeof(buffer),
             APIFMT,
             msgid,
             msgfile,
             pMsgData,
             msgDataLen,
             includeMSGDATA,
             fmtCTL,
             &fc);
     if (fc.Bytes_Available == 0) {
      Qmh_Rtvm_RTVM0100_t* pRtnMsg = (Qmh_Rtvm_RTVM0100_t*) buffer;
      _CPYBYTES(pMsgText, buffer + sizeof(Qmh_Rtvm_RTVM0100_t), pRtnMsg->Length_Message_Returned);
     }
     return;
}

// This function grabs each command generated by the syntax checker
// Note that normally, only the first one (which is usually the last
// syntax error, is returned.
int getNextSyntaxErrorMsg(char* pMsgKey, char* msgid, char* msgtext)
{
  char APIFMT[] = "RCVM0200";
  char MSGTYPE[11];
  char MSGQ[11];
  int  WAIT = 0;
  char msgBuffer[4096];
  Qmh_Rcvpm_RCVM0200_t* pMsgInfo = (Qmh_Rcvpm_RCVM0200_t*)msgBuffer;
  QUSEC_t ec;

  copyPad(MSGTYPE,"*NEXT");
  copyPad(MSGQ,"*");
  memset(msgBuffer, 0x00, sizeof(msgBuffer));

  QMHRCVPM(msgBuffer, sizeof(msgBuffer), QMH_FMT_RCVM0200,
           MSGQ, 1, MSGTYPE, pMsgKey, WAIT,
           QMH_MSGACT_OLD, &ec);
  if (ec.Bytes_Returned == 0 && pMsgInfo->Bytes_Returned > 8)
  {
      _CPYBYTES(msgid, pMsgInfo->Message_Id,7);
      _CPYBYTES(pMsgKey, pMsgInfo->Message_Key,4);
      int mOffset = pMsgInfo->Length_Data_Returned;
      int maxCopyLen = std::min<int>(512,pMsgInfo->Length_Message_Returned);
      _CPYBYTES(msgtext, msgBuffer + sizeof(Qmh_Rcvpm_RCVM0200_t) + mOffset, maxCopyLen);
      return 1;
  }
  return 0;
}
  `;

}
