import Statement from "./statement";

export default class Subroutine extends Statement {
  name: string|undefined;
  constructor(public tokens: Token[], public range: IRange) {
    super(tokens, range);

    this.type = "subroutine";
    this.name = this.processName();
  }

  processName() {
    let possibleName: string|undefined;
    const parms = this.getParms();

    if (parms[`SUBR`] && parms[`SUBR`].length === 1 && parms[`SUBR`][0].type === `word`) {
      possibleName = parms[`SUBR`][0].value;
      
    } else {
      // Search all pieces for a special that is the type
      // SUBR NAME
      const foundName = this.tokens.find(piece => piece.type === `word` && piece.value);
      if (foundName)
        possibleName = foundName.value;
    }

    return possibleName;
  }
}