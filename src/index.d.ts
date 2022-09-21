
interface IRange {
  start: number;
  end: number;
}

interface Token {
  value?: string;
  block?: Token[];
  type: string;
  range: IRange;
}

interface QualifiedObject {
  library?: string;
  name: string;
}