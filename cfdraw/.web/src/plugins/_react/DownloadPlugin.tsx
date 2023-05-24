import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Flex, Spacer } from "@chakra-ui/react";

import { langStore, translate, useSelecting } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { DownloadFormat, allDownloadFormat } from "@/schema/misc";
import { Download_Words } from "@/lang/download";
import { usePluginIds } from "@/stores/pluginsInfo";
import { downloadNodes } from "@/actions/download";
import CFSelect, { CFSrollableSelect } from "@/components/CFSelect";
import CFText, { CFCaption } from "@/components/CFText";
import CFButton from "@/components/CFButton";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { drawboardPluginFactory } from "../utils/factory";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";

const DownloadPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("download").id;
  const lang = langStore.tgt;
  const { type, nodes } = useSelecting("raw");
  const { w, h, imgWH } = useSelecting("basic")({ fixed: 0 }) ?? {};
  const [format, setFormat] = useState<DownloadFormat>("PNG");
  const [keepOriginal, setKeepOriginal] = useState(true);
  const sizeString = useMemo(() => {
    if (!type || type === "none") return null;
    if (type === "multiple") return translate(Download_Words["download-multiple-caption"], lang);
    if (!keepOriginal || type !== "image") return `${w} x ${Math.abs(h!)}`;
    if (!imgWH) return "Loading...";
    return `${imgWH.w} x ${imgWH.h}`;
  }, [type, lang, w, h, imgWH, keepOriginal]);
  const getWord = useCallback(
    (keepOriginal: boolean) =>
      translate(
        keepOriginal
          ? Download_Words["download-image-size-original"]
          : Download_Words["download-image-size-drawboard"],
        lang,
      ),
    [lang],
  );
  const closePanel = useClosePanel(id);
  const onDownload = useCallback(() => {
    downloadNodes(nodes, format, keepOriginal);
    closePanel();
  }, [nodes, format, keepOriginal, closePanel]);

  const selectedDownloadFormat = { value: format, label: format };
  const downloadFormatOptions = allDownloadFormat.map((format) => ({
    value: format,
    label: format,
  }));

  const selectedKeepOriginal = { value: keepOriginal, label: getWord(keepOriginal) };
  const keepOriginalOptions = [true, false].map((keepOriginal) => ({
    value: keepOriginal,
    label: getWord(keepOriginal),
  }));

  if (!nodes) return null;

  return (
    <Render id={id} {...props}>
      <Flex w="100%" h="100%" direction="column">
        <Flex align="center">
          <CFHeading>{translate(Download_Words["download-plugin-header"], lang)}</CFHeading>
          <CFText ml="4px" fontSize="sm">
            ({nodes.length})
          </CFText>
        </Flex>
        <CFDivider />
        <CFSrollableSelect<DownloadFormat, false>
          height="32px"
          fontSize="14px"
          value={selectedDownloadFormat}
          options={downloadFormatOptions}
          onChange={(e) => {
            if (!!e) {
              setFormat(e.value);
            }
          }}
        />
        <CFSelect<boolean, false>
          height="32px"
          fontSize="14px"
          boxProps={{ mt: "10px" }}
          value={selectedKeepOriginal}
          options={keepOriginalOptions}
          onChange={(e) => {
            if (!!e) {
              setKeepOriginal(e.value);
            }
          }}
        />
        <Flex mt="8px" pr="6px">
          <Spacer />
          <CFCaption fontSize="sm">{sizeString}</CFCaption>
        </Flex>
        <CFButton mt="12px" onClick={onDownload}>
          {translate(Download_Words["download-button"], lang)}
        </CFButton>
      </Flex>
    </Render>
  );
};

drawboardPluginFactory.register("download", true)(observer(DownloadPlugin));
