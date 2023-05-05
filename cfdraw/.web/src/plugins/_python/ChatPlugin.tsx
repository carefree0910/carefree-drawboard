import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { isUndefined } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import type { IPythonOnPluginMessage, IPythonQAPlugin } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { removeSocketHooks } from "@/stores/socket";
import { removePluginMessage, removePluginTaskCache, usePluginIds } from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import CFInput from "@/components/CFInput";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import PythonPluginWithSubmit, { socketFinishedEvent } from "./PluginWithSubmit";

const PythonChatPlugin = ({ pluginInfo, ...props }: IPythonQAPlugin) => {
  const { id } = usePluginIds(`Chat_${pluginInfo.identifier}`);
  const [context, setContext] = useState(parseIStr(pluginInfo.initialText));
  const [userInput, setUserInput] = useState("");
  const lang = langStore.tgt;
  const getExtraRequestData = useCallback(() => ({ context, userInput }), [context, userInput]);
  const onMessage = useCallback<IPythonOnPluginMessage>(
    async ({ hash, status, data }) => {
      if (status === "finished") {
        if (data.final?.type === "text") {
          setContext(data.final.value[0].text);
        }
        removeSocketHooks(hash);
        removePluginMessage(id);
        removePluginTaskCache(id);
        socketFinishedEvent.emit({ id });
      } else if (status === "working") {
        const intermediate = data.intermediate?.textList?.[0];
        if (!isUndefined(intermediate)) {
          setContext(intermediate);
        }
      }
      return {};
    },
    [setContext],
  );

  return (
    <PythonPluginWithSubmit
      id={id}
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onMessage={onMessage}
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
