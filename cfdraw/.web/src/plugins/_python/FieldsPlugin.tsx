import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { CloseIcon } from "@chakra-ui/icons";
import { Flex, Spacer } from "@chakra-ui/react";

import { isUndefined } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import type { IPythonResults } from "@/schema/meta";
import type { IPythonFieldsPlugin, IPythonOnSocketMessage } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { Toast_Words } from "@/lang/toast";
import { toastWord } from "@/utils/toast";
import { titleCaseWord } from "@/utils/misc";
import { removeSocketHooks, socketLog } from "@/stores/socket";
import { usePluginIds, removePluginMessage, updatePluginMessage } from "@/stores/plugins";
import { importMeta } from "@/actions/importMeta";
import CFHeading from "@/components/CFHeading";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { useClosePanel } from "../components/hooks";
import { useDefinitions } from "../components/Fields";
import { useCurrentMeta, useDefinitionsRequestDataFn } from "./hooks";
import PythonPluginWithSubmit, { socketFinishedEvent } from "./PluginWithSubmit";

const PythonFieldsPlugin = ({ pluginInfo, ...props }: IPythonFieldsPlugin) => {
  const { id, pureIdentifier } = usePluginIds(pluginInfo.identifier);
  const lang = langStore.tgt;
  const { definitions, retryInterval, noErrorToast } = pluginInfo;
  const getExtraRequestData = useDefinitionsRequestDataFn(definitions);
  const currentMeta = useCurrentMeta(pluginInfo.node, pluginInfo.nodes);
  const emitClose = useClosePanel(id);

  const onMessage = useCallback<IPythonOnSocketMessage<IPythonResults>>(
    async (message) => {
      const {
        hash,
        status,
        data: { final, elapsedTimes },
      } = message;
      switch (status) {
        case "pending": {
          updatePluginMessage(id, message);
          break;
        }
        case "working": {
          updatePluginMessage(id, message);
          break;
        }
        case "finished": {
          removePluginMessage(id);
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
                parameters: getExtraRequestData(),
                response: final,
                elapsedTimes,
                from: currentMeta,
              },
            });
          }
          socketLog(`> remove hook (${hash})`);
          removeSocketHooks(hash);
          break;
        }
        case "exception": {
          if (!noErrorToast) {
            toastWord("error", Toast_Words["submit-task-error-message"], {
              appendix: ` - ${message.message}`,
            });
          }
          // cleanup if retry is not specified
          if (isUndefined(retryInterval)) {
            socketFinishedEvent.emit({ id });
            removePluginMessage(id);
            socketLog(`> remove hook (${hash})`);
            removeSocketHooks(hash);
          }
          break;
        }
      }
      return {};
    },
    [id, lang, pureIdentifier, currentMeta, retryInterval, noErrorToast, getExtraRequestData],
  );
  const onSocketError = useCallback(
    async (err: any) => {
      toastWord("error", Toast_Words["submit-task-error-message"], { appendix: ` - ${err}` });
    },
    [lang],
  );

  const header = pluginInfo.header ?? titleCaseWord(pureIdentifier);
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
