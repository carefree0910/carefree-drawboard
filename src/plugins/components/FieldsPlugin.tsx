import { useMemo } from "react";
import { observer } from "mobx-react-lite";

import type { IInternalTaskPlugin } from "@/types/plugins";
import { subscribe } from "../utils/subscribe";
import Render from "./Render";
import TextField from "./Fields/TextField";
import NumberField from "./Fields/NumberField";

const FieldsPlugin = ({
  pluginInfo: { fields, customDefinitions },
  children,
  ...props
}: Omit<IInternalTaskPlugin, "pluginInfo"> & {
  pluginInfo: Omit<IInternalTaskPlugin["pluginInfo"], "task">;
}) => {
  const definitions = useMemo(
    () => subscribe(fields, customDefinitions),
    [fields, customDefinitions],
  );

  return (
    <Render {...props}>
      {Object.entries(definitions).map(([field, definition]) => {
        let Field = null;
        if (definition.type === "text") {
          Field = TextField;
        } else if (definition.type === "number") {
          Field = NumberField;
        }
        if (!Field) return null;
        return (
          <Field
            key={field}
            field={field}
            definition={definition}
            flexShrink={0}
            {...definition.props}
          />
        );
      })}
      {children}
    </Render>
  );
};

export default observer(FieldsPlugin);
