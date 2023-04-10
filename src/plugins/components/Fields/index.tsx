import { useMemo } from "react";

import { Dictionary, isUndefined } from "@noli/core";
import type { IFieldsPlugin } from "@/types/plugins";
import { subscribe } from "@/plugins/utils/subscribe";
import TextField from "./TextField";
import NumberField from "./NumberField";
import { IFieldDefinition } from "@/types/metaFields";

type IFields = IFieldsPlugin["pluginInfo"]["fields"];
type ICustomDefinitions = IFieldsPlugin["pluginInfo"]["customDefinitions"];

export function useDefinitions(fields: IFields, customDefinitions: ICustomDefinitions) {
  return useMemo(() => subscribe(fields, customDefinitions), [fields, customDefinitions]);
}

export function useFieldsWith(definitions: Dictionary<IFieldDefinition>) {
  return (
    <>
      {Object.entries(definitions).map(([field, definition], i) => {
        let Field: any | null = null;
        if (definition.type === "text") {
          Field = TextField;
        } else if (definition.type === "number") {
          Field = NumberField;
        }
        if (!Field) return null;
        const props = definition.props ?? {};
        if (isUndefined(props.mt) && i !== 0) props.mt = "8px";
        definition.props = props;
        return <Field key={field} field={field} definition={definition} flexShrink={0} />;
      })}
    </>
  );
}

export function useFields(fields: IFields, customDefinitions: ICustomDefinitions) {
  return useFieldsWith(useDefinitions(fields, customDefinitions));
}
