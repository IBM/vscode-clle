import Statement from "./statement";
import { DataType, DefinitionType, IRange, Token } from "./types";

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
  name: Token|undefined;
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
    const typeParm = parms[`TYPE`];

    if (typeParm && typeParm.block && typeParm.block.length === 1) {
      const typeString = typeParm.block[0].value;

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
    let possibleToken: Token|undefined;
    const parms = this.getParms();
    const varParm = parms[`VAR`];

    if (varParm && varParm.block &&  varParm.block.length === 1 && varParm.block[0].type === `variable`) {
      possibleToken = varParm.block[0];
      
    } else {
      // Search all pieces for a special that is the type
      // DCL &ABC *CHAR 20
      const foundName = this.tokens.find(piece => piece.type === `variable` && piece.value);
      if (foundName)
        possibleToken = foundName;
    }

    return possibleToken;
  }
}