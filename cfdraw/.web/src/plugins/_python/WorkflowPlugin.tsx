import { observer } from "mobx-react-lite";

import { isSingleNode, IDefinitions } from "@carefree0910/core";

import type { IPythonWorkflowPlugin } from "@/schema/_python";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { PythonFieldsPlugin } from "./FieldsPlugin";

export const WORKFLOW_KEY = "$workflow";

type IWorkNode =
  | {
      key: string;
      endpoint: "$upload";
      injections: {};
      data: { url: string };
    }
  | {
      key: string;
      endpoint: "$add_text";
      injections: {};
      data: { text: string };
    };
const PythonWorkflowPlugin = ({ pluginInfo, ...props }: IPythonWorkflowPlugin) => {
  let definitions: IDefinitions = {};
  const node = pluginInfo.node;
  if (!!node && isSingleNode(node)) {
    const workflow = node.meta?.data?.response?.extra?.[WORKFLOW_KEY] as IWorkNode[] | undefined;
    if (!!workflow) {
      workflow.forEach((node) => {
        if (node.endpoint === "$upload") {
          definitions[node.key] = {
            type: "image",
            default: node.data.url,
          };
        } else if (node.endpoint === "$add_text") {
          definitions[node.key] = {
            type: "text",
            default: node.data.text,
            numRows: 2,
          };
        }
      });
    }
  }
  return <PythonFieldsPlugin pluginInfo={{ definitions, ...pluginInfo }} {...props} />;
};

drawboardPluginFactory.registerPython("_python.workflow", true)(observer(PythonWorkflowPlugin));
