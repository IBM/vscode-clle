import Statement from "./statement";

enum Type {
  Unknown,
  Character,
  Packed,
  Pointer,
  Label,
  Subroutine
}

const TypeValue: {[typeString: string]: Type} = {
  '*CHAR': Type.Character,
  '*PACKED': Type.Packed,
  '*POINTER': Type.Pointer
}

const TypeSpecials = Object.keys(TypeValue);

export default class Definition extends Statement {
  constructor(public tokens: Token[], public range: IRange) {
    super(tokens, range);
  }

  getType(): Type {
    let possibleType: Type = Type.Unknown;
    const parms = this.getParms();

    if (parms[`TYPE`] && parms[`TYPE`].length === 1) {
      const typeString = parms[`TYPE`][0].value;

      if (typeString) possibleType = TypeValue[typeString];
      
    } else {
      // Search all pieces for a special that is the type
      // DCL &ABC *CHAR 20
      const typePiece = this.tokens.find(piece => piece.type === `special` && piece.value && TypeSpecials.includes(piece.value.toUpperCase()));
      if (typePiece)
        if (typePiece.value) 
          possibleType = TypeValue[typePiece.value];
    }

    return possibleType;
  }

  getName() {
    let possibleName: string|undefined;
    const parms = this.getParms();

    if (parms[`VAR`] && parms[`VAR`].length === 1 && parms[`VAR`][0].type === `variable`) {
      possibleName = parms[`VAR`][0].value;
      
    } else {
      // Search all pieces for a special that is the type
      // DCL &ABC *CHAR 20
      const foundName = this.tokens.find(piece => piece.type === `variable` && piece.value);
      if (foundName)
        possibleName = foundName.value;
    }

    return possibleName;
  }
}