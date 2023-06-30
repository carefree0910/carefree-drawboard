import { useEffect } from "react";
import { observer } from "mobx-react-lite";

import { IImageFilterParams, INode, getRandomHash, imageFilterSettings } from "@carefree0910/core";
import { langStore, translate, useFilters } from "@carefree0910/business";

import type { IListProperties } from "@/schema/plugins";
import type { ISelectField } from "@/schema/fields";
import { UI_Words } from "@/lang/ui";
import { DEFAULT_GAP } from "@/utils/constants";
import { getFieldData, setFieldData } from "@/stores/dataCenter";
import List, { ID_KEY, IListItem } from "../../components/Fields/ListField/List";
import { getDefaults } from "../../components/Fields/ListField";

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

interface IFiltersEditor {
  node: INode | null;
  field: string;
}
const FiltersEditor = ({ node, field }: IFiltersEditor) => {
  const lang = langStore.tgt;
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

  const label = translate(UI_Words["filters-label"], lang);
  const tooltip = translate(UI_Words["filters-tooltip"], lang);
  const values: IListItem[] | undefined = getFieldData(fieldKeys);

  if (!values) return null;

  return (
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
  );
};

export default observer(FiltersEditor);
