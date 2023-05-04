import React from "react";

import { Logger, checkNotExists } from "@carefree0910/core";

import type { ReactPlugins, AllPlugins, PythonPlugins } from "@/schema/plugins";

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
          Logger.warn(`${e}`);
        } else {
          throw e;
        }
      }
    }
    d[name] = fn;
  };
}

class DrawboardPluginFactory {
  d: Partial<Record<ReactPlugins, React.FC>> = {};
  python_d: Partial<Record<PythonPlugins, React.FC>> = {};

  constructor(public name: string) {}

  register(name: ReactPlugins, overwrite: boolean = false): Function {
    return registerPlugin(this.d, name, overwrite);
  }

  registerPython(name: PythonPlugins, overwrite: boolean = false): Function {
    return registerPlugin(this.python_d, name, overwrite);
  }

  checkIsPython(name: AllPlugins): name is PythonPlugins {
    return !!(this.python_d as any)[name];
  }

  get(name: AllPlugins): React.FC | null {
    return ((this.checkIsPython(name) ? this.python_d : this.d) as any)[name] ?? null;
  }
}
export const drawboardPluginFactory = new DrawboardPluginFactory("drawboard.plugin");
