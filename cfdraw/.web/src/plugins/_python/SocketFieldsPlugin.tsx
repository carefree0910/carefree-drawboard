import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { CloseIcon } from "@chakra-ui/icons";
import { Flex, Spacer, useToast } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";

import type { IPythonFieldsResponse } from "@/schema/meta";
import type { IPythonFieldsPlugin, IPythonOnSocketMessage } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { Toast_Words } from "@/lang/toast";
import { toast } from "@/utils/toast";
import { titleCaseWord } from "@/utils/misc";
import { removeSocketHook, socketStore } from "@/stores/socket";
import { importMeta } from "@/actions/importMeta";
import CFHeading from "@/components/CFHeading";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { useClosePanel } from "../components/hooks";
import { useCurrentMeta, useDefinitionsRequestDataFn, useFieldsPluginIds } from "./hooks";
import PythonSocketPluginWithSubmit, { socketFinishedEvent } from "./SocketPluginWithSubmit";
import DefinitionFields from "./DefinitionFields";

const PythonSocketFieldsPlugin = ({ pluginInfo, ...props }: IPythonFieldsPlugin) => {
  const { id, identifierId } = useFieldsPluginIds(pluginInfo.identifier);
  const t = useToast();
  const lang = langStore.tgt;
  const definitions = pluginInfo.definitions;
  const getExtraRequestData = useDefinitionsRequestDataFn(definitions);
  const currentMeta = useCurrentMeta(pluginInfo.node);
  const emitClose = useClosePanel(id);

  const onMessage = useCallback<IPythonOnSocketMessage<IPythonFieldsResponse>>(
    async ({
      data: {
        hash,
        status,
        total,
        pending,
        data: { progress, intermediate, final },
      },
    }) => {
      switch (status) {
        case "finished": {
          socketFinishedEvent.emit({ id });
          if (!final) {
            toast(
              t,
              "success",
              `${translate(Toast_Words["submit-task-finished-message"], lang)} (${identifierId})`,
            );
          } else {
            const { _duration, ...response } = final;
            importMeta({
              t,
              lang,
              type: "python.socketFields",
              metaData: {
                identifier: identifierId,
                parameters: getExtraRequestData(),
                response,
                duration: _duration,
                from: currentMeta,
              },
            });
          }
          socketStore.log(`> remove hook (${hash})`);
          removeSocketHook(hash);
        }
      }
      return {};
    },
    [id, lang, identifierId, currentMeta, getExtraRequestData],
  );
  const onSocketError = useCallback(
    async (err: any) => {
      toast(t, "error", `${translate(Toast_Words["submit-task-error-message"], lang)} - ${err}`);
    },
    [t, lang],
  );

  const header = pluginInfo.header ?? titleCaseWord(identifierId);
  return (
    <PythonSocketPluginWithSubmit
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
      <DefinitionFields definitions={definitions} numColumns={pluginInfo.numColumns} />
    </PythonSocketPluginWithSubmit>
  );
};

const _ = observer(PythonSocketFieldsPlugin);
drawboardPluginFactory.registerPython("_python.socketFields", true)(_);
export default _;
