import Statement from "./statement";
import { DefinitionType, IRange, Token } from "./types";

export default class Subroutine extends Statement {
  name: Token|undefined;
  constructor(public tokens: Token[], public range: IRange) {
    super(tokens, range);

    this.type = DefinitionType.Subroutine;
    this.name = this.processName();
  }

  processName() {
    let possibleToken: Token|undefined;
    const parms = this.getParms();
    const subrParm = parms[`SUBR`];

    if (subrParm && subrParm.block && subrParm.block.length === 1 && subrParm.block[0].type === `word`) {
      possibleToken = subrParm.block[0];
      
    } else {
      // Search all pieces for a special that is the type
      // SUBR NAME
      const foundName = this.tokens.find(piece => piece.type === `word` && piece.value);
      if (foundName)
        possibleToken = foundName;
    }

    return possibleToken;
  }
}