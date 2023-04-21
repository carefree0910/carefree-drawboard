import { observer } from "mobx-react-lite";
import { CloseIcon } from "@chakra-ui/icons";
import { Flex, Spacer, useToast } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";

import type { IPythonFieldsResponse } from "@/schema/meta";
import type { IPythonFieldsPlugin, IPythonResponse } from "@/schema/_python";
import { UI_Words } from "@/lang/ui";
import { Toast_Words } from "@/lang/toast";
import { toast } from "@/utils/toast";
import { titleCaseWord } from "@/utils/misc";
import { importMeta } from "@/actions/importMeta";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import CFHeading from "@/components/CFHeading";
import { useClosePanel } from "../components/hooks";
import { useCurrentMeta, useDefinitionsRequestDataFn, useFieldsPluginIds } from "./hooks";
import PythonHttpPluginWithSubmit from "./HttpPluginWithSubmit";
import DefinitionFields from "./DefinitionFields";

const PythonHttpFieldsPlugin = ({ pluginInfo, ...props }: IPythonFieldsPlugin) => {
  const { id, identifierId } = useFieldsPluginIds(pluginInfo.identifier);
  const t = useToast();
  const lang = langStore.tgt;
  const definitions = pluginInfo.definitions;
  const getExtraRequestData = useDefinitionsRequestDataFn(definitions);
  const currentMeta = useCurrentMeta(pluginInfo.node);
  const emitClose = useClosePanel(id);

  async function onUseHttpPythonSuccess({
    data: { _duration, ...response },
  }: IPythonResponse<IPythonFieldsResponse>) {
    importMeta({
      t,
      lang,
      type: "python.httpFields",
      metaData: {
        identifier: identifierId,
        parameters: getExtraRequestData(),
        response,
        duration: _duration,
        from: currentMeta,
      },
    });
  }
  async function onUseHttpPythonError(err: any) {
    toast(t, "error", `${translate(Toast_Words["submit-task-error-message"], lang)} - ${err}`);
  }

  const header = pluginInfo.header ?? titleCaseWord(identifierId);
  return (
    <PythonHttpPluginWithSubmit
      id={id}
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onUseHttpPythonSuccess={onUseHttpPythonSuccess}
      onUseHttpPythonError={onUseHttpPythonError}
      pluginInfo={pluginInfo}
      {...props}>
      <Flex>
        <CFHeading>{header}</CFHeading>
        <Spacer />
        <CloseIcon w="12px" cursor="pointer" onClick={emitClose} />
      </Flex>
      <DefinitionFields definitions={definitions} numColumns={pluginInfo.numColumns} />
    </PythonHttpPluginWithSubmit>
  );
};

const _ = observer(PythonHttpFieldsPlugin);
drawboardPluginFactory.registerPython("_python.httpFields", true)(_);
export default _;
