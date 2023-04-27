import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Flex, Spacer } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore, translate, useSelecting } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { DownloadFormat, allDownloadFormat } from "@/schema/misc";
import { Download_Words } from "@/lang/download";
import { themeStore } from "@/stores/theme";
import { downloadNodes } from "@/actions/download";
import CFSelect, { CFSrollableSelect } from "@/components/CFSelect";
import CFText from "@/components/CFText";
import CFButton from "@/components/CFButton";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";
import { useClosePanel } from "../components/hooks";

const DownloadPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `download_${getRandomHash()}`, []);
  const lang = langStore.tgt;
  const { type, nodes } = useSelecting("raw");
  const { w, h, imgWH } = useSelecting("basic")({ fixed: 0 }) ?? {};
  const { captionColor } = themeStore.styles;
  const [format, setFormat] = useState<DownloadFormat>("PNG");
  const [keepOriginal, setKeepOriginal] = useState(true);
  const sizeString = useMemo(() => {
    if (!type || type === "none") return null;
    if (type === "multiple") return translate(Download_Words["download-multiple-caption"], lang);
    if (!keepOriginal || type !== "image") return `${w} x ${Math.abs(h!)}`;
    if (!imgWH) return "Loading...";
    return `${imgWH.w} x ${imgWH.h}`;
  }, [type, lang, w, h, imgWH, keepOriginal]);

  if (!nodes) return null;

  const getWord = (keepOriginal: string) =>
    translate(
      keepOriginal === "true"
        ? Download_Words["download-image-size-original"]
        : Download_Words["download-image-size-drawboard"],
      lang,
    );
  const closePanel = useClosePanel(id);
  const onDownload = () => {
    downloadNodes(nodes, format, keepOriginal);
    closePanel();
  };

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
        <CFSrollableSelect
          value={format}
          options={allDownloadFormat as any}
          onOptionClick={(option) => setFormat(option as DownloadFormat)}
        />
        <CFSelect
          mt="4px"
          value={keepOriginal ? "true" : "false"}
          options={["true", "false"]}
          optionConverter={getWord}
          onOptionClick={(option) => setKeepOriginal(option === "true")}
        />
        <Flex mt="8px" pr="6px">
          <Spacer />
          <CFText color={captionColor} fontSize="sm">
            {sizeString}
          </CFText>
        </Flex>
        <CFButton mt="12px" onClick={onDownload}>
          {translate(Download_Words["download-button"], lang)}
        </CFButton>
      </Flex>
    </Render>
  );
};

drawboardPluginFactory.register("download", true)(observer(DownloadPlugin));
