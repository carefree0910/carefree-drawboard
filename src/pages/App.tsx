import { langStore } from "@noli/business";

import { useFileDropper } from "@/hooks/useFileDropper";
import { useInitBoard } from "@/hooks/useInitBoard";
import BoardPanel from "@/panels/BoardPanel";
import { Flex } from "@chakra-ui/react";

function App() {
  useInitBoard();
  useFileDropper(langStore.tgt);

  return (
    <Flex h="100vh" className="p-editor" direction="column" userSelect="none" minW="1090px">
      <Flex w="100%" flex={1}>
        <BoardPanel />
      </Flex>
    </Flex>
  );
}

export default App;
