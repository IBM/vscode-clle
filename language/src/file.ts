import Statement from "./statement";
import { DefinitionType, IRange, QualifiedObject, Token } from "./types";

export default class File extends Statement {
  file: QualifiedObject|undefined;
  constructor(public tokens: Token[], public range: IRange) {
    super(tokens, range);

    this.type = DefinitionType.File;
    this.file = this.processFile();
  }

  private processFile(): QualifiedObject|undefined {
    const parms = this.getParms();
    const fileParm = parms[`FILE`];

    if (fileParm && fileParm.block) {
      const blockTokens = fileParm.block;

      if (blockTokens.length === 3 && blockTokens[1].type === `forwardslash` && blockTokens[0].value && blockTokens[2].value) {
        return {
          library: blockTokens[0].value,
          name: blockTokens[2].value
        };
      } 
      
      else if (blockTokens.length === 1 && blockTokens[0].value) {
        return {
          name: blockTokens[0].value
        };
      }
    }
  }

  getOpenID(): string|undefined {
    const parms = this.getParms();
    const opnId = parms[`OPNID`];

    if (opnId && opnId.block) {
      const blockTokens = opnId.block;
      if (blockTokens.length === 1 &&  blockTokens[0].type === `word` && blockTokens[0].value) {
        return blockTokens[0].value;
      }
    }
  }
}