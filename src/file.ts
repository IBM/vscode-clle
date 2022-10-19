import Statement from "./statement";
import { DefinitionType } from "./types";

export default class File extends Statement {
  file: QualifiedObject|undefined;
  constructor(public tokens: Token[], public range: IRange) {
    super(tokens, range);

    this.type = DefinitionType.File;
    this.file = this.processFile();
  }

  processFile(): QualifiedObject|undefined {
    const parms = this.getParms();

    if (parms[`FILE`]) {
      const blockTokens = parms[`FILE`];

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

    if (parms[`OPNID`]) {
      const blockTokens = parms[`OPNID`];
      if (blockTokens.length === 1 &&  blockTokens[0].type === `word` && blockTokens[0].value) {
        return blockTokens[0].value;
      }
    }
  }
}