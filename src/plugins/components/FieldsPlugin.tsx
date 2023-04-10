import { useMemo } from "react";
import { observer } from "mobx-react-lite";

import type { IInternalTaskPlugin } from "@/types/plugins";
import type { ISubscribableFields } from "@/types/metaFields";
import { subscribe } from "../utils/subscribe";
import Render from "./Render";
import TextField from "./TextField";
import NumberField from "./NumberField";

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
        if (definition.type === "text") {
          return (
            <TextField
              key={field}
              field={field as ISubscribableFields}
              definition={definition}
              flexShrink={0}
              {...definition.props}
            />
          );
        }
        if (definition.type === "number") {
          return (
            <NumberField
              key={field}
              field={field as ISubscribableFields}
              definition={definition}
              flexShrink={0}
              {...definition.props}
            />
          );
        }
        return null;
      })}
      {children}
    </Render>
  );
};

export default observer(FieldsPlugin);
