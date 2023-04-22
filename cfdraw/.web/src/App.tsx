import { Flex } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";

import { langStore } from "@carefree0910/business";

import { useWebSocket } from "./stores/socket";
import { useInitBoard } from "./hooks/useInitBoard";
import { useFileDropper } from "./hooks/useFileDropper";
import { useGridLines } from "./hooks/useGridLines";
import { usePreventDefaults } from "./hooks/usePreventDefaults";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useSyncPython } from "./hooks/usePython";
import BoardPanel from "./BoardPanel";

function App() {
  useWebSocket();
  useSyncPython();
  useInitBoard();
  useFileDropper(langStore.tgt);
  useGridLines();
  useUndoRedo();
  usePreventDefaults();

  return (
    <Flex h="100vh" className="p-editor" direction="column" userSelect="none">
      <Flex w="100%" flex={1}>
        <BoardPanel />
      </Flex>
    </Flex>
  );
}

export default observer(App);
