import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";

import type { IPythonOnPluginMessage, IPythonQAPlugin } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { usePluginIds } from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import CFInput from "@/components/CFInput";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import PythonPluginWithSubmit from "./PluginWithSubmit";
import { cleanupException, cleanupFinished } from "../utils/cleanup";

const PythonQAPlugin = ({ pluginInfo, ...props }: IPythonQAPlugin) => {
  const { id } = usePluginIds(`QA_${pluginInfo.identifier}`);
  const [userInput, setUserInput] = useState("");
  const [serverText, setServerText] = useState(parseIStr(pluginInfo.initialText));
  const lang = langStore.tgt;
  const getExtraRequestData = useCallback(() => ({ text: userInput }), [userInput]);
  const onMessage = useCallback<IPythonOnPluginMessage>(
    async (message) => {
      const { status, data } = message;
      if (status === "finished") {
        if (data.final?.type === "text") {
          setServerText(data.final.value[0].text);
        }
        cleanupFinished({ id, message });
      } else if (status === "exception") {
        cleanupException({ id, message, pluginInfo });
      } else {
        setServerText("Thinking...");
      }
      return {};
    },
    [setServerText],
  );

  return (
    <PythonPluginWithSubmit
      id={id}
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onMessage={onMessage}
      pluginInfo={pluginInfo}
      {...props}>
      <Textarea w="100%" h="40%" minH="0px" value={serverText} readOnly />
      <CFInput
        w="100%"
        h="30%"
        mt="16px"
        value={userInput}
        onChange={(event) => setUserInput(event.target.value)}
        placeholder={translate(UI_Words["qa-field-placeholder"], lang)}
      />
    </PythonPluginWithSubmit>
  );
};

drawboardPluginFactory.registerPython("_python.QA", true)(observer(PythonQAPlugin));
