import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useToast } from "@chakra-ui/react";

import { langStore, translate } from "@noli/business";

import type { IPythonHttpFieldsData, IPythonHttpFieldsResponse } from "@/types/narrowedMeta";
import type { IPythonHttpFieldsPlugin, IPythonHttpResponse } from "@/types/_python";
import { allSubscribableFields } from "@/types/metaFields";
import { UI_Words } from "@/lang/ui";
import { stripHashFromIdentifier } from "@/utils/misc";
import { importMeta } from "@/actions/importMeta";
import { getMetaField } from "@/stores/meta";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import { CFHeading } from "@/components/CFHeading";
import PythonHttpPluginWithSubmit from "./HttpPluginWithSubmit";
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

  function getExtraRequestData() {
    const { externalData, ...others } = data;
    return { ...others, ...externalData };
  }
  async function onUseHttpPythonSuccess({
    data: { type, value },
  }: IPythonHttpResponse<IPythonHttpFieldsResponse>) {
    importMeta({
      t,
      lang,
      type: "python.httpFields",
      metaData: {
        type,
        value,
        identifier: pureIdentifier,
        data,
      } as any,
    });
  }

  const header = pluginInfo.header ?? pureIdentifier;
  return (
    <PythonHttpPluginWithSubmit
      buttonText={translate(UI_Words["submit-task"], lang)}
      getExtraRequestData={getExtraRequestData}
      onUseHttpPythonSuccess={onUseHttpPythonSuccess}
      pluginInfo={pluginInfo}
      {...props}>
      <CFHeading>{header}</CFHeading>
      {useFieldsWith(definitions)}
    </PythonHttpPluginWithSubmit>
  );
};

const _ = observer(PythonHttpFieldsPlugin);
drawboardPluginFactory.registerPython("_python.httpFields", true)(_);
export default _;
