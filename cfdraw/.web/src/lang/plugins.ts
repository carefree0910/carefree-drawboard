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
    email: "邮件",
    github: "Github",
    shortcuts: "快捷键",
    logo: "Logo",
    basicEditor: "编辑基础属性",
    textEditor: "编辑文本",
    imageEditor: "编辑图片",
    svgEditor: "编辑 SVG",
    noliFrameEditor: "编辑艺术字",
    noliTextFrameEditor: "编辑复杂文本",
    groupEditor: "编辑组",
    multiEditor: "编辑多节点",
    brush: "画笔",
    "_python.pluginGroup": "Python 插件组",
    "_python.fields": "Python 插件",
    "_python.workflow": "Python 工作流",
    "_python.textArea": "Python 文本框",
    "_python.QA": "Python 问答",
    "_python.chat": "Python 对话",
    "_python.markdown": "Python Markdown",
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
    wiki: "Documentation",
    email: "Email",
    github: "Github",
    shortcuts: "Shortcuts",
    logo: "Logo",
    basicEditor: "Edit Basic Fields",
    textEditor: "Edit Text",
    imageEditor: "Edit Image",
    svgEditor: "Edit SVG",
    noliFrameEditor: "Edit Art Text",
    noliTextFrameEditor: "Edit Advanced Text",
    groupEditor: "Edit Group",
    multiEditor: "Edit Multi Nodes",
    brush: "Brush",
    "_python.pluginGroup": "Python Plugin Group",
    "_python.fields": "Python Plugin",
    "_python.workflow": "Python Workflow",
    "_python.textArea": "Python TextArea",
    "_python.QA": "Python Q & A",
    "_python.chat": "Python Chat",
    "_python.markdown": "Python Markdown",
  },
};

export const Plugins_Words: Record<AllPlugins, string> = {} as any;
export const pluginsLangRecords: Record<Lang, Dictionary<string>> = {} as any;

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
  pluginsLangRecords[lang as Lang] = reverseMapping(reversedRecord);
});
