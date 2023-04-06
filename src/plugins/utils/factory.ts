import React from "react";

import { checkNotExists } from "@noli/core";

import type { AvailablePlugins } from "@/types/plugins";

class PluginFactory {
  d: Partial<Record<AvailablePlugins, React.FC>> = {};

  constructor(public name: string) {}

  register(name: AvailablePlugins, overwrite: boolean = false): Function {
    const factory = this;
    return function (fn: React.FC) {
      if (!overwrite) {
        checkNotExists(factory.d, name, `please change another name for this ${factory.name}`);
      }
      factory.d[name] = fn;
    };
  }

  get(name: AvailablePlugins): React.FC | null {
    return this.d[name] ?? null;
  }
}
export const pluginFactory = new PluginFactory("plugin");
