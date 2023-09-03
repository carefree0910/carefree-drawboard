import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { CloseIcon } from "@chakra-ui/icons";
import { Flex, Spacer } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";
import { CFHeading, Definitions, toastWord } from "@carefree0910/components";

import type { OnPythonPluginMessage, IPythonFieldsPlugin } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { CFDraw_Toast_Words } from "@/lang/toast";
import { titleCaseWord } from "@/utils/misc";
import { usePluginIds, usePluginTaskCache } from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import { importMeta } from "@/actions/importMeta";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { useClosePanel } from "../components/hooks";
import { useDefinitionsGetInjectionsFn, useDefinitionsRequestDataFn } from "./hooks";
import PythonPluginWithSubmit from "./PluginWithSubmit";

const BasePythonFieldsPlugin = ({ pluginInfo, ...props }: IPythonFieldsPlugin) => {
  const { id, pureIdentifier } = usePluginIds(pluginInfo.identifier);
  const lang = langStore.tgt;
  const { definitions } = pluginInfo;
  const getExtraRequestData = useDefinitionsRequestDataFn(definitions);
  const getInjections = useDefinitionsGetInjectionsFn(definitions);
  const emitClose = useClosePanel(id);
  const taskCache = usePluginTaskCache(id);

  const onFinished = useCallback<OnPythonPluginMessage>(
    ({ data: { final, injections, elapsedTimes } }) => {
      if (!final) {
        toastWord("success", CFDraw_Toast_Words["submit-task-finished-message"], {
          appendix: ` (${pureIdentifier})`,
        });
      } else {
        importMeta({
          lang,
          type: "python.fields",
          metaData: {
            identifier: pureIdentifier,
            response: final,
            injections: { ...taskCache?.injections, ...injections },
            elapsedTimes,
            from: taskCache?.currentMeta,
          },
        });
      }
    },
    [id, pureIdentifier, lang, taskCache],
  );
  const onSocketError = useCallback(
    async (err: any) => {
      toastWord("error", CFDraw_Toast_Words["submit-task-error-message"], {
        appendix: ` - ${err}`,
      });
    },
    [lang],
  );

  const header = parseIStr(pluginInfo.header ?? titleCaseWord(pureIdentifier));
  return (
    <PythonPluginWithSubmit
      id={id}
      pluginInfo={pluginInfo}
      buttonText={translate(UI_Words["submit-task"], lang)}
      onFinished={onFinished}
      onSocketError={onSocketError}
      getExtraRequestData={getExtraRequestData}
      getInjections={getInjections}
      {...props}>
      <Flex>
        <CFHeading>{header}</CFHeading>
        <Spacer />
        <CloseIcon w="12px" cursor="pointer" onClick={emitClose} />
      </Flex>
      <Definitions definitions={definitions} numColumns={pluginInfo.numColumns} />
    </PythonPluginWithSubmit>
  );
};

export const PythonFieldsPlugin = observer(BasePythonFieldsPlugin);
drawboardPluginFactory.registerPython("_python.fields", true)(PythonFieldsPlugin);
