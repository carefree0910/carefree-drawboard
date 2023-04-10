import { useMemo } from "react";

import { isUndefined } from "@noli/core";
import type { IFieldsPlugin } from "@/types/plugins";
import { subscribe } from "@/plugins/utils/subscribe";
import TextField from "./TextField";
import NumberField from "./NumberField";

export function useFields(
  fields: IFieldsPlugin["pluginInfo"]["fields"],
  customDefinitions: IFieldsPlugin["pluginInfo"]["customDefinitions"],
) {
  const definitions = useMemo(
    () => subscribe(fields, customDefinitions),
    [fields, customDefinitions],
  );

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
