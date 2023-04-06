import type { AvailablePlugins, IPluginProps } from "@/types/plugins";

import { Logger } from "@noli/core";

import { pluginFactory } from "./utils/factory";

// these lines are needed to make sure the plugins are registered
export * from "./TaskPlugin";
export * from "./MetaPlugin";

export function makePlugin<T extends AvailablePlugins>(type: T, props: IPluginProps[T]) {
  const Plugin = pluginFactory.get(type);
  if (!Plugin) Logger.warn(`Plugin '${type}' not found`);
  return Plugin ? <Plugin {...props} /> : null;
}
