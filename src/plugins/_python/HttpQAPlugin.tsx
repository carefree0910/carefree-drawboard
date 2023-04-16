import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { getRandomHash } from "@noli/core";
import { langStore, translate } from "@noli/business";

import type { IPythonHttpQAPlugin, IPythonResponse } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import CFInput from "@/components/CFInput";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { useIdentifierId } from "./hooks";
import PythonHttpPluginWithSubmit from "./HttpPluginWithSubmit";

const PythonHttpQAPlugin = ({ pluginInfo, ...props }: IPythonHttpQAPlugin) => {
  const identifierId = useIdentifierId(pluginInfo.identifier);
  const id = useMemo(() => `${identifierId}_QA_${getRandomHash()}`, []);
  const [userInput, setUserInput] = useState("");
  const [serverText, setServerText] = useState(pluginInfo.initialText);
  const lang = langStore.tgt;

  function getExtraRequestData() {
    return { text: userInput };
  }
  async function onUseHttpPythonSuccess(res: IPythonResponse<{ text: string }>) {
    setServerText(res.data.text);
  }

  return (
    <PythonHttpPluginWithSubmit
      id={id}
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onUseHttpPythonSuccess={onUseHttpPythonSuccess}
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
    </PythonHttpPluginWithSubmit>
  );
};

const _ = observer(PythonHttpQAPlugin);
drawboardPluginFactory.registerPython("_python.httpQA", true)(_);
export default _;
