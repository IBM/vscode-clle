import Statement from "./statement";
import { DataType, DefinitionType } from "./types";

const TypeValue: {[typeString: string]: DataType} = {
  '*CHAR': DataType.Character,
  '*DEC': DataType.Packed,
  '*LGL': DataType.Logical,
  '*INT': DataType.Integer,
  '*UINT': DataType.UInteger,
  '*PTR': DataType.Pointer,
}

const TypeSpecials = Object.keys(TypeValue);

export default class Variable extends Statement {
  name: string|undefined;
  dataType: DataType;
  constructor(public tokens: Token[], public range: IRange) {
    super(tokens, range);

    this.type = DefinitionType.Variable;
    this.name = this.processName();
    this.dataType = this.processType();
  }

  processType(): DataType {
    let possibleType: DataType = DataType.Unknown;
    const parms = this.getParms();

    if (parms[`TYPE`] && parms[`TYPE`].length === 1) {
      const typeString = parms[`TYPE`][0].value;

      if (typeString) possibleType = TypeValue[typeString.toUpperCase()];
      
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

  processName() {
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