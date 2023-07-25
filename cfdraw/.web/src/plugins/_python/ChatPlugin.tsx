import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";
import { CFInput } from "@carefree0910/components";

import type { OnPythonPluginMessage, IPythonQAPlugin } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { usePluginIds } from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import PythonPluginWithSubmit from "./PluginWithSubmit";

const PythonChatPlugin = ({ pluginInfo, ...props }: IPythonQAPlugin) => {
  const id = usePluginIds(`Chat_${pluginInfo.identifier}`).id;
  const [context, setContext] = useState(parseIStr(pluginInfo.initialText));
  const [userInput, setUserInput] = useState("");
  const lang = langStore.tgt;
  const getExtraRequestData = useCallback(() => ({ context, userInput }), [context, userInput]);
  const onIntermediate = useCallback<OnPythonPluginMessage>(
    async ({ data: { intermediate } }) => {
      if (intermediate?.textList?.length) {
        setContext(intermediate.textList[0]);
      }
    },
    [setContext],
  );
  const onFinished = useCallback<OnPythonPluginMessage>(
    async ({ data: { final } }) => {
      if (final?.type === "text") {
        setContext(final.value[0].text);
      }
    },
    [setContext],
  );

  return (
    <PythonPluginWithSubmit
      id={id}
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onIntermediate={onIntermediate}
      onFinished={onFinished}
      pluginInfo={pluginInfo}
      {...props}>
      <Textarea w="100%" flex={1} minH="0px" value={context} readOnly />
      <CFInput
        w="100%"
        h="42px"
        mt="16px"
        value={userInput}
        onChange={(event) => setUserInput(event.target.value)}
        placeholder={translate(UI_Words["chat-field-placeholder"], lang)}
      />
    </PythonPluginWithSubmit>
  );
};

drawboardPluginFactory.registerPython("_python.chat", true)(observer(PythonChatPlugin));
