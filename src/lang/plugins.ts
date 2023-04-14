import { Dictionary, Lang } from "@noli/core";

import {
  allAvailablePlugins,
  allAvailablePythonPlugins,
  AvailablePluginsAndPythonPlugins,
} from "@/schema/plugins";

const _pluginsLangRecords: Record<Lang, Record<AvailablePluginsAndPythonPlugins, string>> = {
  zh: {
    settings: "设置",
    project: "项目",
    add: "添加",
    arrange: "智能整理",
    undo: "撤销",
    redo: "重做",
    download: "下载",
    textEditor: "编辑文本",
    groupEditor: "编辑组",
    multiEditor: "编辑多节点",
    "_python.httpTextArea": "文本框",
    "_python.httpQA": "问答",
    "_python.httpFields": "插件",
  },
  en: {
    settings: "Settings",
    project: "Project",
    add: "Add",
    arrange: "Auto Arrange",
    undo: "Undo",
    redo: "Redo",
    download: "Download",
    textEditor: "Edit Text",
    groupEditor: "Edit Group",
    multiEditor: "Edit Multi Nodes",
    "_python.httpTextArea": "TextArea",
    "_python.httpQA": "Q & A",
    "_python.httpFields": "Plugin",
  },
};

export const Plugins_Words: Record<AvailablePluginsAndPythonPlugins, string> = {} as any;
export const pluginsLangRecords: Dictionary<Dictionary<string>> = {};

function injectScope(scope: string, data: Dictionary<string>) {
  Object.entries(data).forEach(([key, value]) => {
    data[key] = `${scope}.${value}`;
  });
}
function reverseMapping(data: Dictionary<string>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [value, key]));
}

allAvailablePlugins.forEach((plugin) => {
  (Plugins_Words as any)[plugin] = plugin;
});
allAvailablePythonPlugins.forEach((plugin) => {
  (Plugins_Words as any)[plugin] = plugin;
});
const scope = "plugins";
injectScope(scope, Plugins_Words);
Object.entries(_pluginsLangRecords).forEach(([lang, record]) => {
  const reversedRecord = reverseMapping(record);
  injectScope(scope, reversedRecord);
  pluginsLangRecords[lang] = reverseMapping(reversedRecord);
});
