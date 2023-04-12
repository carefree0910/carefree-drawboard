import { useMemo } from "react";

import { Dictionary, isUndefined } from "@noli/core";
import type { IFieldsPlugin } from "@/types/plugins";
import { subscribe } from "@/plugins/utils/subscribe";
import TextField from "./TextField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import { IFieldDefinition } from "@/types/metaFields";

type IFields = IFieldsPlugin["pluginInfo"]["fields"];
type ICustomDefinitions = IFieldsPlugin["pluginInfo"]["customDefinitions"];

export function useDefinitions(fields: IFields, customDefinitions: ICustomDefinitions) {
  return useMemo(() => subscribe(fields, customDefinitions), [fields, customDefinitions]);
}

export function useFieldsWith(definitions: Dictionary<IFieldDefinition>, numColumns?: number) {
  const nc = numColumns ?? 1;

  return (
    <>
      {Object.entries(definitions).map(([field, definition], i) => {
        let Field: any | null = null;
        if (definition.type === "text") {
          Field = TextField;
        } else if (definition.type === "number") {
          Field = NumberField;
        } else if (definition.type === "select") {
          Field = SelectField;
        }
        if (!Field) return null;
        const props = definition.props ?? {};
        if (isUndefined(props.h)) props.h = "42px";
        if (isUndefined(props.w)) {
          props.w = numColumns === 1 ? "100%" : `${(100 - 5 * (nc - 1)) / nc}%`;
        }
        definition.props = props;
        return <Field key={field} field={field} definition={definition} />;
      })}
    </>
  );
}

export function useFields(
  fields: IFields,
  customDefinitions: ICustomDefinitions,
  numColumns?: number,
) {
  return useFieldsWith(useDefinitions(fields, customDefinitions), numColumns);
}
