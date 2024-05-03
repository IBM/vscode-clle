import { DefinitionType, IRange, QualifiedObject, Token } from "./types";

export default class Statement {
  type: DefinitionType;
  constructor(public tokens: Token[], public range: IRange) {
    this.type = DefinitionType.Statement;
  }

  getObject(): QualifiedObject|null {
    const noNewLines = this.tokens.filter(p => p.type !== `newline`);
    if (noNewLines.length === 1 &&  noNewLines[0].type !== `label` && noNewLines[0].value) {
      return {
        name: noNewLines[0].value
      };
    } else if (noNewLines.length >= 2) {
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

  getPreParm() {
    const noNewLines = this.tokens.filter(p => p.type !== `newline`);
    const firstParm = noNewLines.findIndex(p => p.type === `parameter`);
    const object = this.getObject();
    const fromIndex = object?.library === undefined ? 1 : 3;

    if (firstParm > 0) {
      return noNewLines.slice(fromIndex, firstParm);
    }

    return noNewLines.slice(fromIndex);
  }

  getParms() {
    const noNewLines = this.tokens.filter(p => p.type !== `newline`);
    const parms: {[name: string]: Token} = {};

    noNewLines.forEach((piece, i) => {
      if (piece.type === `parameter` && piece.value) {
        const parm = noNewLines[i+1];
        if (parm && parm.type === `block` && parm.block) {
          parms[piece.value.toUpperCase()] = parm;
        }
      }
    });

    return parms;
  }

	getTokenByOffset(offset: number) {
		const blockSearch = (tokens: Token[]): Token|undefined => {
			const token = tokens.find(token => offset >= token.range.start && offset <= token.range.end);
			
			if (token?.type === `block` && token.block) {
				return blockSearch(token.block);
			}

			return token;
		}

		return blockSearch(this.tokens);
	}

  isDirective() {
    return this.tokens[0]?.type === `directive`;
  }
}