

export default class Statement {
  constructor(public tokens: Token[], public range: IRange) {}

  getObject(): QualifiedObject|null {
    const noNewLines = this.tokens.filter(p => p.type !== `newline`);
    if (noNewLines.length === 1 &&  noNewLines[0].type !== `label` && noNewLines[0].value) {
      return {
        name: noNewLines[0].value
      };
    } else if (noNewLines.length >= 3) {
      if (noNewLines[1].type === `forwardslash` && noNewLines[0].value && noNewLines[2].value) {
        return {
          library: noNewLines[0].value,
          name: noNewLines[2].value
        };
      } else
      if (noNewLines[0].value) {
        return {
          name: noNewLines[0].value
        };
      }
    }
     
    return null;
  }

  getParms() {
    const noNewLines = this.tokens.filter(p => p.type !== `newline`);
    const parms: {[name: string]: Token[]} = {};

    noNewLines.forEach((piece, i) => {
      if (piece.type === `parameter` && piece.value) {
        const parm = noNewLines[i+1];
        if (parm && parm.type === `block` && parm.block) {
          parms[piece.value.toUpperCase()] = parm.block;
        } else {
          parms[piece.value.toUpperCase()] = [];
        }
      }
    });

    return parms;
  }
}