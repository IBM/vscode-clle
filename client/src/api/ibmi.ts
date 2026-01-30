import { CodeForIBMi } from "@halcyontech/vscode-ibmi-types";
import { ComponentRegistry } from '@halcyontech/vscode-ibmi-types/api/components/manager';
import { VscodeTools } from "@halcyontech/vscode-ibmi-types/ui/Tools";
import { CustomUI } from '@halcyontech/vscode-ibmi-types/webviews/CustomUI';
import Instance from "@halcyontech/vscode-ibmi-types/Instance";
import { Extension, extensions } from "vscode";

let baseExtension: Extension<CodeForIBMi> | undefined;

export function loadBase(): CodeForIBMi | undefined {
  if (!baseExtension) {
    baseExtension = (extensions ? extensions.getExtension(`halcyontechltd.code-for-ibmi`) : undefined);
  }

  return (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports : undefined);
}

export function getInstance(): Instance | undefined {
  return (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports.instance : undefined);
}

export function getComponentRegistry(): ComponentRegistry | undefined {
    return (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports.componentRegistry : undefined);
}

export function getCustomUI(): CustomUI | undefined {
  return (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports.customUI() : undefined);
}

export function getVSCodeTools(): typeof VscodeTools | undefined {
  return (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports.tools : undefined);
}