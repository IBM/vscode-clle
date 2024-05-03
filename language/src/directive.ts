import Statement from "./statement";
import { DefinitionType, IRange, Token } from "./types";

export default class Directive extends Statement {
  constructor(public tokens: Token[], public range: IRange) {
    super(tokens, range);

    this.tokens = tokens.slice(1);

    this.type = DefinitionType.Directive;
  }

  hasParameters() {
    return this.tokens.length > 0;
  }

  isDataDirective() {
    return this.tokens[0]?.value === `DATA`;
  }

  override isDirective(): boolean {
    return true;
  }
}