import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";
import { CFInput } from "@carefree0910/components";

import type { IPythonQAPlugin, OnPythonPluginMessage } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { usePluginIds } from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import PythonPluginWithSubmit from "./PluginWithSubmit";

const PythonQAPlugin = ({ pluginInfo, ...props }: IPythonQAPlugin) => {
  const id = usePluginIds(`QA_${pluginInfo.identifier}`).id;
  const [userInput, setUserInput] = useState("");
  const [serverText, setServerText] = useState(parseIStr(pluginInfo.initialText));
  const lang = langStore.tgt;
  const getExtraRequestData = useCallback(() => ({ text: userInput }), [userInput]);
  const onFinished = useCallback<OnPythonPluginMessage>(
    async ({ data: { final } }) => {
      if (final?.type === "text") {
        setServerText(final.value[0].text);
      }
    },
    [setServerText],
  );

  return (
    <PythonPluginWithSubmit
      id={id}
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onFinished={onFinished}
      pluginInfo={pluginInfo}
      {...props}>
      <Textarea w="100%" flex={1} minH="0px" value={serverText} readOnly />
      <CFInput
        w="100%"
        h="42px"
        mt="16px"
        value={userInput}
        onChange={(event) => setUserInput(event.target.value)}
        placeholder={translate(UI_Words["qa-field-placeholder"], lang)}
      />
    </PythonPluginWithSubmit>
  );
};

drawboardPluginFactory.registerPython("_python.QA", true)(observer(PythonQAPlugin));
