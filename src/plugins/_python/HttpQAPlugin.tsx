import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Input, Textarea } from "@chakra-ui/react";

import type { IPythonHttpQAPlugin } from "@/types/_python";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import PythonHttpPluginWithSubmit from "./HttpPluginWithSubmit";
import { langStore, translate } from "@noli/business";
import { UI_Words } from "@/utils/lang/ui";
import { IPythonHttpResponse } from "@/types/_python";

const PythonHttpQAPlugin = ({ pluginInfo, ...props }: IPythonHttpQAPlugin) => {
  const [userInput, setUserInput] = useState("");
  const [serverText, setServerText] = useState(pluginInfo.initialText);
  const lang = langStore.tgt;

  function getExtraRequestData() {
    return { text: userInput };
  }
  async function onUseHttpPythonSuccess(res: IPythonHttpResponse<{ text: string }>) {
    setServerText(res.data.text);
  }

  return (
    <PythonHttpPluginWithSubmit
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onUseHttpPythonSuccess={onUseHttpPythonSuccess}
      pluginInfo={pluginInfo}
      {...props}>
      <Textarea w="100%" h="40%" minH="0px" value={serverText} readOnly />
      <Input
        w="100%"
        h="30%"
        mt="16px"
        value={userInput}
        onChange={(event) => setUserInput(event.target.value)}
        placeholder={translate(UI_Words["qa-field-placeholder"], langStore.tgt)}></Input>
    </PythonHttpPluginWithSubmit>
  );
};
drawboardPluginFactory.registerPython("_python.httpQA", true)(observer(PythonHttpQAPlugin));
