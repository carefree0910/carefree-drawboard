import React from "react";

import { Logger, checkNotExists } from "@noli/core";

import type {
  AvailablePlugins,
  AvailablePluginsAndPythonPlugins,
  AvailablePythonPlugins,
} from "@/types/plugins";

function registerPlugin<T extends string>(
  d: Partial<Record<T, React.FC>>,
  name: T,
  overwrite: boolean = false,
): Function {
  return function (fn: React.FC) {
    if (!overwrite) {
      try {
        checkNotExists(d, name, `please change another name for this plugin`);
      } catch (e) {
        if (Logger.isDebug) {
          Logger.error(`${e}`);
        } else {
          throw e;
        }
      }
    }
    d[name] = fn;
  };
}

class DrawboardPluginFactory {
  d: Partial<Record<AvailablePlugins, React.FC>> = {};
  python_d: Partial<Record<AvailablePythonPlugins, React.FC>> = {};

  constructor(public name: string) {}

  register(name: AvailablePlugins, overwrite: boolean = false): Function {
    return registerPlugin(this.d, name, overwrite);
  }

  registerPython(name: AvailablePythonPlugins, overwrite: boolean = false): Function {
    return registerPlugin(this.python_d, name, overwrite);
  }

  checkIsPython(name: AvailablePluginsAndPythonPlugins): name is AvailablePythonPlugins {
    return !!(this.python_d as any)[name];
  }

  get(name: AvailablePluginsAndPythonPlugins): React.FC | null {
    return ((this.checkIsPython(name) ? this.python_d : this.d) as any)[name] ?? null;
  }
}
export const drawboardPluginFactory = new DrawboardPluginFactory("drawboard.plugin");
