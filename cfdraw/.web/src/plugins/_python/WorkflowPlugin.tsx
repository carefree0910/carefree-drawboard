import { observer } from "mobx-react-lite";

import { Dictionary, isSingleNode } from "@carefree0910/core";

import type { IDefinitions } from "@/schema/fields";
import type { IPythonWorkflowPlugin } from "@/schema/_python";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { PythonFieldsPlugin } from "./FieldsPlugin";

const WORKFLOW_KEY = "$workflow";

type UploadNodeKey = "$upload";
type IWorkNode =
  | {
      key: string;
      endpoint: UploadNodeKey;
      injections: {};
      data: { url: string };
    }
  | {
      key: string;
      endpoint: Omit<string, UploadNodeKey>;
      injections: Dictionary<any>;
      data: Dictionary<any>;
    };
const PythonWorkflowPlugin = ({ pluginInfo, ...props }: IPythonWorkflowPlugin) => {
  let definitions: IDefinitions = {};
  const node = pluginInfo.node;
  if (!!node && isSingleNode(node)) {
    const workflow = node.meta?.data?.response?.extra?.[WORKFLOW_KEY] as IWorkNode[] | undefined;
    if (!!workflow) {
      workflow.forEach((node) => {
        if (node.endpoint !== "$upload") return;
        definitions[node.key] = {
          type: "image",
          default: node.data.url,
        };
      });
    }
  }
  return <PythonFieldsPlugin pluginInfo={{ definitions, ...pluginInfo }} {...props} />;
};

drawboardPluginFactory.registerPython("_python.workflow", true)(observer(PythonWorkflowPlugin));
