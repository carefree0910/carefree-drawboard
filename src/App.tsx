import { Flex } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";

import { langStore } from "@noli/business";

import BoardPanel from "@/panels/BoardPanel";
import { useInitBoard } from "./hooks/useInitBoard";
import { useFileDropper } from "./hooks/useFileDropper";
import { useGridLines } from "./hooks/useGridLines";

function App() {
  useInitBoard();
  useFileDropper(langStore.tgt);
  useGridLines();

  return (
    <Flex h="100vh" className="p-editor" direction="column" userSelect="none">
      <Flex w="100%" flex={1}>
        <BoardPanel />
      </Flex>
    </Flex>
  );
}

export default observer(App);
