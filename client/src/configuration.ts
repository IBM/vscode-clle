import * as vscode from "vscode";

const getConfiguration = (): vscode.WorkspaceConfiguration => {
  return vscode.workspace.getConfiguration(`vscode-clle`);
}

export default class Configuration {
  static get<T>(prop: string) {
    return getConfiguration().get<T>(prop);
  }

  static set(prop: string, newValue: any) {
    return getConfiguration().update(prop, newValue, true);
  }
}
