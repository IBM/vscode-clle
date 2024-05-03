export enum DataType {
  Unknown,
  Character,
  Packed,
  Pointer,
  Label,
  Subroutine,
  Logical,
  Integer,
  UInteger
}

export enum DefinitionType {
  Directive = "directive",
  Statement = "statement",
  Variable = "variable",
  File = "file",
  Subroutine = "subroutine"
}

export interface IRange {
  start: number;
  end: number;
}

export interface Token {
  value?: string;
  block?: Token[];
  type: string;
  range: IRange;
}

export interface QualifiedObject {
  library?: string;
  name: string;
}