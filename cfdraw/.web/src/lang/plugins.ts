import { Dictionary, Lang } from "@carefree0910/core";

import { allReactPlugins, allPythonPlugins, AllPlugins } from "@/schema/plugins";

const _pluginsLangRecords: Record<Lang, Record<AllPlugins, string>> = {
  zh: {
    meta: "元数据",
    settings: "设置",
    project: "项目",
    add: "添加",
    arrange: "智能整理",
    undo: "撤销",
    redo: "重做",
    download: "下载",
    delete: "删除",
    wiki: "文档",
    github: "Github",
    email: "邮件",
    textEditor: "编辑文本",
    groupEditor: "编辑组",
    multiEditor: "编辑多节点",
    brush: "画笔",
    "_python.fields": "Python 插件",
    "_python.textArea": "Python 文本框",
    "_python.QA": "Python 问答",
    "_python.pluginGroup": "Python 插件组",
  },
  en: {
    meta: "Meta",
    settings: "Settings",
    project: "Project",
    add: "Add",
    arrange: "Auto Arrange",
    undo: "Undo",
    redo: "Redo",
    download: "Download",
    delete: "Delete",
    wiki: "Wiki",
    github: "Github",
    email: "Email",
    textEditor: "Edit Text",
    groupEditor: "Edit Group",
    multiEditor: "Edit Multi Nodes",
    brush: "Brush",
    "_python.fields": "Python Plugin",
    "_python.textArea": "Python TextArea",
    "_python.QA": "Python Q & A",
    "_python.pluginGroup": "Python Plugin Group",
  },
};

export const Plugins_Words: Record<AllPlugins, string> = {} as any;
export const pluginsLangRecords: Dictionary<Dictionary<string>> = {};

function injectScope(scope: string, data: Dictionary<string>) {
  Object.entries(data).forEach(([key, value]) => {
    data[key] = `${scope}.${value}`;
  });
}
function reverseMapping(data: Dictionary<string>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [value, key]));
}

allReactPlugins.forEach((plugin) => {
  (Plugins_Words as any)[plugin] = plugin;
});
allPythonPlugins.forEach((plugin) => {
  (Plugins_Words as any)[plugin] = plugin;
});
const scope = "plugins";
injectScope(scope, Plugins_Words);
Object.entries(_pluginsLangRecords).forEach(([lang, record]) => {
  const reversedRecord = reverseMapping(record);
  injectScope(scope, reversedRecord);
  pluginsLangRecords[lang] = reverseMapping(reversedRecord);
});
