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

    if (parms[`SUBR`] && parms[`SUBR`].length === 1 && parms[`SUBR`][0].type === `word`) {
      possibleToken = parms[`SUBR`][0];
      
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