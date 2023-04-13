import { useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { CloseIcon } from "@chakra-ui/icons";
import { Flex, Spacer, useToast } from "@chakra-ui/react";

import { getRandomHash } from "@noli/core";
import { langStore, translate } from "@noli/business";

import type { IPythonHttpFieldsData, IPythonHttpFieldsResponse } from "@/types/narrowedMeta";
import type { IPythonHttpFieldsPlugin, IPythonHttpResponse } from "@/types/_python";
import { allSubscribableFields } from "@/types/metaFields";
import { UI_Words } from "@/lang/ui";
import { stripHashFromIdentifier, titleCaseWord } from "@/utils/misc";
import { importMeta } from "@/actions/importMeta";
import { getMetaField } from "@/stores/meta";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { CFHeading } from "@/components/CFHeading";
import PythonHttpPluginWithSubmit from "./HttpPluginWithSubmit";
import { floatingControlEvent } from "../components/Floating";
import { useDefinitions, useFieldsWith } from "../components/Fields";

const PythonHttpFieldsPlugin = ({ pluginInfo, ...props }: IPythonHttpFieldsPlugin) => {
  const t = useToast();
  const lang = langStore.tgt;
  const definitions = useDefinitions([], pluginInfo.customDefinitions);
  const data = useMemo<IPythonHttpFieldsData>(() => {
    const data: IPythonHttpFieldsData = { externalData: {} };
    Object.keys(definitions).forEach((field) => {
      if (allSubscribableFields.includes(field)) {
        data[field] = getMetaField(field);
      } else {
        data.externalData[field] = getMetaField(field);
      }
    });
    return data;
  }, [definitions]);
  const pureIdentifier = useMemo(
    () => stripHashFromIdentifier(pluginInfo.identifier),
    [pluginInfo.identifier],
  );
  const currentMeta = useMemo(() => {
    const node = pluginInfo.node;
    let currentMeta;
    if (node && node.type !== "group") {
      currentMeta = node.params.meta;
    }
    return currentMeta;
  }, [pluginInfo.node]);
  const id = useMemo(
    () => `${pureIdentifier.replaceAll(".", "_")}_${getRandomHash()}`,
    [pureIdentifier],
  );
  const emitClose = useCallback(() => floatingControlEvent.emit({ id, expand: false }), [id]);

  function getExtraRequestData() {
    const { externalData, ...others } = data;
    return { ...others, ...externalData };
  }
  async function onUseHttpPythonSuccess({
    data: { type, value, _duration },
  }: IPythonHttpResponse<IPythonHttpFieldsResponse>) {
    importMeta({
      t,
      lang,
      type: "python.httpFields",
      metaData: {
        type,
        identifier: pureIdentifier,
        value,
        data,
        duration: _duration,
        from: currentMeta,
      } as any,
    });
  }

  const header = pluginInfo.header ?? titleCaseWord(pureIdentifier);
  return (
    <PythonHttpPluginWithSubmit
      id={id}
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onUseHttpPythonSuccess={onUseHttpPythonSuccess}
      pluginInfo={pluginInfo}
      {...props}>
      <Flex>
        <CFHeading>{header}</CFHeading>
        <Spacer />
        <CloseIcon w="12px" cursor="pointer" onClick={emitClose} />
      </Flex>
      {Object.keys(definitions).length > 0 && (
        <Flex p="12px" gap="12px" flexWrap="wrap" alignItems="center" justifyContent="space-around">
          {useFieldsWith(definitions, pluginInfo.numColumns)}
        </Flex>
      )}
    </PythonHttpPluginWithSubmit>
  );
};

const _ = observer(PythonHttpFieldsPlugin);
drawboardPluginFactory.registerPython("_python.httpFields", true)(_);
export default _;
