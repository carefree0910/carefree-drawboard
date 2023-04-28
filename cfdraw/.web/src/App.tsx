import { Flex } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";

import { useSetup } from "./hooks/useSetup";
import { useWebSocket } from "./stores/socket";
import { usePointerEvents } from "./stores/pointerEvents";
import { useInitBoard } from "./hooks/useInitBoard";
import { useFileDropper } from "./hooks/useFileDropper";
import { useGridLines } from "./hooks/useGridLines";
import { usePreventDefaults } from "./hooks/usePreventDefaults";
import { CFAuthGuard } from "./components/CFAuth";
import BoardPanel from "./BoardPanel";

function App() {
  useSetup();
  useWebSocket();
  useInitBoard();
  useFileDropper();
  useGridLines();
  usePreventDefaults();
  usePointerEvents();

  return (
    <Flex h="100vh" className="p-editor" direction="column" userSelect="none">
      <Flex w="100%" flex={1}>
        <CFAuthGuard>
          <BoardPanel />
        </CFAuthGuard>
      </Flex>
    </Flex>
  );
}

export default observer(App);
