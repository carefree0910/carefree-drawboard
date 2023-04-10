import { observer } from "mobx-react-lite";

import type { IFieldsPlugin } from "@/types/plugins";
import Render from "./Render";
import { useFields } from "./Fields";

const FieldsPlugin = ({
  pluginInfo: { fields, customDefinitions },
  children,
  ...props
}: IFieldsPlugin) => {
  return (
    <Render {...props}>
      {useFields(fields, customDefinitions)}
      {children}
    </Render>
  );
};

export default observer(FieldsPlugin);
