
interface Matcher {
  name: string;
  match: {
    type: string;
    match?: Function;
  }[];
  becomes: string;
};

export default class CLParser {
  matchers: Matcher[] = [
    {
      name: `VARIABLE`,
      match: [{type: `ampersand`}, {type: `word`}],
      becomes: `variable`
    },
    {
      name: `SPECIAL`,
      match: [{type: `asterisk`}, {type: `word`}],
      becomes: `special`
    },
    {
      name: `LABEL`,
      match: [{type: `word`}, {type: `colon`}],
      becomes: `label`
    },
    {
      name: `NEWLINE`,
      match: [{type: `newliner`}, {type: `newline`}],
      becomes: `newline`,
    }
  ];
  readonly spaces = [` `];
  readonly splitParts: string[] = [`(`, `)`, `/`, `*`, `+`, `:`, `&`, `\n`, `\r`, ...this.spaces];
  readonly types: {[part: string]: string} = {
    '(': `openbracket`,
    ')': `closebracket`,
    '/': `forwardslash`,
    '*': `asterisk`,
    '+': `plus`,
    ':': `colon`,
    '&': `ampersand`,
    '\n': `newline`,
    '\r': `newliner`,
  };
  readonly stringChar: string = `'`;
  readonly comments: string[] = [`/*`, `*/`];

  constructor() {}

  parseDocument(content: string) {
    let commentStart = -1;
    let inComment = false;

    let inString = false;

    let result: Token[] = [];

    let startsAt = 0;
    let currentText = ``;

    for (let i = 0; i < content.length; i++) {
      if (content[i] && content[i+1] && this.comments.includes(content.substring(i, i+2))) {
        inComment = !inComment;
        
        if (inComment) {
          commentStart = i;
        } else {
          // Remove comment
          content = content.substring(0, commentStart) + ` `.repeat((i + 2) - commentStart) + content.substring(i+2);
          // TODO: consider adding comment to result?
        }
        i++; //increment an extra one before
      } else if (inComment) {
        continue;
      
      } else if (inString && content[i] !== this.stringChar) {
        currentText += content[i];
      } else {
        switch (content[i]) {
        case this.stringChar:
          if (inString) {
            currentText += content[i];
            result.push({value: currentText, type: `string`, range: {start: startsAt, end: startsAt + currentText.length}});
            currentText = ``;
          } else {
            startsAt = i;
            currentText += content[i];
          }

          inString = !inString;
          break;
        default:
          if (this.splitParts.includes(content[i]) && inString === false) {
            if (currentText.trim() !== ``) {
              result.push({value: currentText, type: `word`, range: {start: startsAt, end: startsAt + currentText.length}});
              currentText = ``;
            }

            if (!this.spaces.includes(content[i])) {
              result.push({value: content[i], type: this.types[content[i]], range: {start: i, end: i + content[i].length}});
            }

            startsAt = i + 1;

          } else {
            currentText += content[i];
          }
          break;
        }
      }
    }

    if (currentText.trim() !== ``) {
      result.push({value: currentText, type: `word`, range: {start: startsAt, end: startsAt + currentText.length}});
      currentText = ``;
    }

    result = this.fixStatement(result);
    result = this.createBlocks(result);
    
    this.locateCommands(result);

    return result;
  }

  fixStatement(tokens: Token[]) {
    for (let i = 0; i < tokens.length; i++) {
      for (let y = 0; y < this.matchers.length; y++) {
        const type = this.matchers[y];
        let goodMatch = true;

        for (let x = 0; x < type.match.length; x++) {
          const match = type.match[x];
          
          if (tokens[i+x]) {
            if (tokens[i+x].type === match.type) {
              if (match.match) {
                if (match.match(tokens[i+x].value)) {
                  goodMatch = true;
                } else {
                  goodMatch = false;
                  break;
                }
              } else {
                goodMatch = true;
              }
            } else {
              goodMatch = false;
              break;
            }
          } else {
            goodMatch = false;
          }
        }

        if (goodMatch) {
          const matchedTokens = tokens.slice(i, i + type.match.length);
          const value = matchedTokens.map(x => x.value).join(``);
          tokens.splice(i, type.match.length, {
            type: type.becomes,
            value,
            range: {
              start: matchedTokens[0].range.start,
              end: matchedTokens[matchedTokens.length-1].range.end
            }
          });

          break;
        }
      }
    }

    return tokens;
  }

  createBlocks(tokens: Token[]) {
    let start = 0;
    let level = 0;

    for (let i = 0; i < tokens.length; i++) {
      switch (tokens[i].type) {
      case `openbracket`:
        if (level === 0) {
          start = i;
        }
        level++;
        break;
      case `closebracket`:
        level--;

        if (level === 0) {
          tokens.splice(start, i - start + 1, {
            type: `block`,
            block: this.createBlocks(tokens.slice(start+1, i)),
            range: {
              start: tokens[start].range.start,
              end: tokens[i].range.end
            }
          });
          i = start;
        }
        break;
      }
    }

    return tokens;
  }

  locateCommands(tokens: Token[]) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === `word`) {
        if (tokens[i+1]) {
          if (tokens[i+1].type === `block`) {
            tokens[i].type = `parameter`
          } else
          if (!tokens[i-1] || (tokens[i-1] && tokens[i-1].type !== `command`)) {
            tokens[i].type = `command`;
          }
        }
      }
    }
  }

  static getEOL(content: string) {
      return (content.match(/\r/) ? '\r' : '') + (content.match(/\n/) ? '\n' : '');
  }
}