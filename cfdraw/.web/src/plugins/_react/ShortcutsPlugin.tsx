import { observer } from "mobx-react-lite";

import { Lang } from "@carefree0910/core";
import { langStore } from "@carefree0910/business";

import type { IPythonPlugin } from "@/schema/_python";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { usePluginIds } from "@/stores/pluginsInfo";
import CFMarkdown from "@/components/CFMarkdown";
import Render from "@/plugins/components/Render";

const shortcutsMarkdown: Record<Lang, string> = {
  zh: `
| 快捷键 | 行为 |
| :----- | ---: |
| \`Command\`+\`A\` | 选中所有节点 |
| \`Command\`+\`C\` | 复制 |
| \`Command\`+\`V\` | 粘贴 |
| \`Command\`+\`[\` | 当前节点往后移动一层 |
| \`Command\`+\`]\` | 当前节点往前移动一层 |
| \`[\` | 当前节点移到最低层 |
| \`]\` | 当前节点移到最顶层 |
| \`Delete\` | 删除选中的节点 |
| \`Command\`+\`G\` | 打组 |
| \`Command\`+\`Shift\`+\`G\` | 解组 |
| \`Command\`+\`Z\`  | 撤销 |
| \`Command\`+\`Shift\`+\`Z\` | 重做 |
`,
  en: `
| Shortcut | Behaviour |
| :------- | ---------: |
| \`Command\`+\`A\` | Select all \`Node\`s |
| \`Command\`+\`C\` | Copy |
| \`Command\`+\`V\` | Paste |
| \`Command\`+\`[\` | Move one layer backward |
| \`Command\`+\`]\` | Move one layer forward |
| \`[\` | Move to the bottom |
| \`]\` | Move to the top |
| \`Delete\` | Delete selecting \`Node\`(s) |
| \`Command\`+\`G\` | Group |
| \`Command\`+\`Shift\`+\`G\` | Ungroup |
| \`Command\`+\`Z\` | Undo |
| \`Command\`+\`Shift\`+\`Z\` | Redo |
`,
};
const ShortcutsPlugin = ({ pluginInfo, ...props }: IPythonPlugin) => {
  const id = usePluginIds("shortcuts").id;
  const lang = langStore.tgt;

  return (
    <Render id={id} {...props}>
      <CFMarkdown markdown={shortcutsMarkdown[lang]} />
    </Render>
  );
};

drawboardPluginFactory.register("shortcuts", true)(observer(ShortcutsPlugin));
