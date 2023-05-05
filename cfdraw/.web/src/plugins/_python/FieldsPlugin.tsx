import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { CloseIcon } from "@chakra-ui/icons";
import { Flex, Spacer } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";

import type { IPythonFieldsPlugin, IPythonOnPluginMessage } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { Toast_Words } from "@/lang/toast";
import { toastWord } from "@/utils/toast";
import { titleCaseWord } from "@/utils/misc";
import { usePluginIds, setPluginMessage, usePluginTaskCache } from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import { importMeta } from "@/actions/importMeta";
import CFHeading from "@/components/CFHeading";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { useClosePanel } from "../components/hooks";
import { useDefinitions } from "../components/Fields";
import { useDefinitionsRequestDataFn } from "./hooks";
import PythonPluginWithSubmit, { socketFinishedEvent } from "./PluginWithSubmit";
import { OnFinished, cleanupException, cleanupFinished } from "../utils/cleanup";

const PythonFieldsPlugin = ({ pluginInfo, ...props }: IPythonFieldsPlugin) => {
  const { id, pureIdentifier } = usePluginIds(pluginInfo.identifier);
  const lang = langStore.tgt;
  const { definitions, retryInterval, noErrorToast } = pluginInfo;
  const getExtraRequestData = useDefinitionsRequestDataFn(definitions);
  const emitClose = useClosePanel(id);
  const taskCache = usePluginTaskCache(id);

  const onFinished = useCallback<OnFinished>(
    ({ data: { final, elapsedTimes } }) => {
      socketFinishedEvent.emit({ id });
      if (!final) {
        toastWord("success", Toast_Words["submit-task-finished-message"], {
          appendix: ` (${pureIdentifier})`,
        });
      } else {
        importMeta({
          lang,
          type: "python.fields",
          metaData: {
            identifier: pureIdentifier,
            parameters: taskCache?.parameters ?? {},
            response: final,
            elapsedTimes,
            from: taskCache?.currentMeta,
          },
        });
      }
    },
    [id, pureIdentifier, lang, taskCache],
  );
  const onMessage = useCallback<IPythonOnPluginMessage>(
    async (message) => {
      switch (message.status) {
        case "pending": {
          setPluginMessage(id, message);
          break;
        }
        case "working": {
          setPluginMessage(id, message);
          break;
        }
        case "finished": {
          cleanupFinished({ id, message, onFinished });
          break;
        }
        case "exception": {
          cleanupException({ id, message, pluginInfo });
          break;
        }
      }
      return {};
    },
    [id, lang, pureIdentifier, retryInterval, noErrorToast, onFinished],
  );
  const onSocketError = useCallback(
    async (err: any) => {
      toastWord("error", Toast_Words["submit-task-error-message"], { appendix: ` - ${err}` });
    },
    [lang],
  );

  const header = parseIStr(pluginInfo.header ?? titleCaseWord(pureIdentifier));
  const Definitions = useDefinitions({ definitions, numColumns: pluginInfo.numColumns });
  return (
    <PythonPluginWithSubmit
      id={id}
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onMessage={onMessage}
      onSocketError={onSocketError}
      pluginInfo={pluginInfo}
      {...props}>
      <Flex>
        <CFHeading>{header}</CFHeading>
        <Spacer />
        <CloseIcon w="12px" cursor="pointer" onClick={emitClose} />
      </Flex>
      {Definitions}
    </PythonPluginWithSubmit>
  );
};

drawboardPluginFactory.registerPython("_python.fields", true)(observer(PythonFieldsPlugin));
