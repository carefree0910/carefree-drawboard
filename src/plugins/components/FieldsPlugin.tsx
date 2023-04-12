import { observer } from "mobx-react-lite";
import { Flex } from "@chakra-ui/react";

import type { IFieldsPlugin } from "@/types/plugins";
import Render from "./Render";
import { useFields } from "./Fields";

const FieldsPlugin = ({
  pluginInfo: { fields, customDefinitions, numColumns },
  renderInfo,
  children,
  ...props
}: IFieldsPlugin) => {
  return (
    <Render renderInfo={renderInfo} {...props}>
      <Flex p="12px" gap="12px" flexWrap="wrap" alignItems="center" justifyContent="space-around">
        {useFields(fields, customDefinitions, numColumns)}
      </Flex>
      {children}
    </Render>
  );
};

export default observer(FieldsPlugin);
