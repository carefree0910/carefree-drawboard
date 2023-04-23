import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import type { IPythonOnSocketMessage, IPythonQAPlugin } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import CFInput from "@/components/CFInput";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { useIdentifierId } from "./hooks";
import PythonPluginWithSubmit from "./PluginWithSubmit";

const PythonQAPlugin = ({ pluginInfo, ...props }: IPythonQAPlugin) => {
  const identifierId = useIdentifierId(pluginInfo.identifier);
  const id = useMemo(() => `${identifierId}_QA_${getRandomHash()}`, []);
  const [userInput, setUserInput] = useState("");
  const [serverText, setServerText] = useState(pluginInfo.initialText);
  const lang = langStore.tgt;
  const getExtraRequestData = useCallback(() => ({ text: userInput }), [userInput]);
  const onMessage = useCallback<IPythonOnSocketMessage<{ text: string }>>(
    async ({ status, data }) => {
      if (status === "finished") {
        setServerText(data.final?.text ?? "");
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
        placeholder={translate(UI_Words["qa-field-placeholder"], langStore.tgt)}
      />
    </PythonPluginWithSubmit>
  );
};

drawboardPluginFactory.registerPython("_python.QA", true)(observer(PythonQAPlugin));
