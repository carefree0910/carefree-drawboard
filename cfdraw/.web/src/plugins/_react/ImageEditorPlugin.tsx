import { useEffect } from "react";
import { observer } from "mobx-react-lite";

import { IImageFilterParams, getRandomHash, imageFilterSettings } from "@carefree0910/core";
import { langStore, translate, useFilters } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import type { ISelectField } from "@/schema/fields";
import { UI_Words } from "@/lang/ui";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { DEFAULT_GAP } from "@/utils/constants";
import { getFieldData, setFieldData } from "@/stores/dataCenter";
import { usePluginIds } from "@/stores/pluginsInfo";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { drawboardPluginFactory } from "../utils/factory";
import List, { ID_KEY, IListItem } from "../components/Fields/ListField/List";
import { getDefaults } from "../components/Fields/ListField";
import BasicEditor from "./components/BasicEditor";
import Render from "../components/Render";

const values2params = (values: IListItem[]): IImageFilterParams[] => {
  return values.map(({ type, ...others }) => ({ type, params: others }));
};
const params2values = (params: IImageFilterParams[]): IListItem[] => {
  return params.map(({ type, params }) => ({
    [ID_KEY]: getRandomHash().toString(),
    type,
    ...params,
  }));
};

const ImageEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("imageEditor").id;
  const lang = langStore.tgt;
  const field = "$ImageEditor$";
  const fieldKeys = { field };
  const { filters, setFilters } = useFilters({ allowUsePreviousNode: true });

  // controlled
  useEffect(() => {
    if (node?.type === "image") {
      const existing = getFieldData(fieldKeys);
      const latest = params2values(filters ?? []);
      if (JSON.stringify(existing) !== JSON.stringify(latest)) {
        setFieldData(fieldKeys, latest);
      }
    }
  }, [fieldKeys, filters, node?.type]);

  const label = translate(UI_Words["image-editor-filters-label"], lang);
  const tooltip = translate(UI_Words["image-editor-filters-tooltip"], lang);
  const values: IListItem[] | undefined = getFieldData(fieldKeys);

  if (!values) return null;

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["image-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
      <CFDivider />
      <List
        label={label}
        tooltip={tooltip}
        field={field}
        expandH={180}
        getNewItem={() => ({ type: "alpha", ...getDefaults(imageFilterSettings.alpha) })}
        getDefinitions={(index) => {
          const typeDefinition: ISelectField = {
            type: "select",
            default: "alpha",
            options: Object.keys(imageFilterSettings),
          };
          return {
            type: typeDefinition,
            ...imageFilterSettings[values[index].type],
          };
        }}
        gap={DEFAULT_GAP}
        onListChange={(values) => setFilters({ trace: false })(values2params(values))}
        onListChangeComplete={(values) => setFilters({ trace: true })(values2params(values))}
        getDisplayKey={() => "type"}
      />
    </Render>
  );
};
drawboardPluginFactory.register("imageEditor", true)(observer(ImageEditorPlugin));
