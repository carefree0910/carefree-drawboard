import { Flex } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";

import type { IDefinitions } from "@/schema/fields";
import { useDefinitions } from "../components/Fields";

interface IDefinitionFields {
  definitions: IDefinitions;
  numColumns?: number;
}
function DefinitionFields({ definitions, numColumns }: IDefinitionFields) {
  return (
    <>
      {Object.keys(definitions).length > 0 && (
        <Flex p="12px" gap="12px" flexWrap="wrap" alignItems="center" justifyContent="space-around">
          {useDefinitions(definitions, numColumns)}
        </Flex>
      )}
    </>
  );
}

export default observer(DefinitionFields);
