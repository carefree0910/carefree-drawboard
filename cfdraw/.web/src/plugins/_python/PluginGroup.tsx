import { observer } from "mobx-react-lite";
import { Box, Flex, Spacer } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

import { shallowCopy } from "@carefree0910/core";

import { IPythonPluginGroup } from "@/schema/_python";
import { titleCaseWord } from "@/utils/misc";
import { getPluginIds } from "@/stores/plugins";
import { drawboardPluginFactory } from "../utils/factory";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";
import { makePlugin } from "..";
import CFHeading from "@/components/CFHeading";
import CFDivider from "@/components/CFDivider";

const PythonPluginGroup = ({ pluginInfo, renderInfo, ...props }: IPythonPluginGroup) => {
  const { id, pureIdentifier } = getPluginIds(pluginInfo.identifier);
  const header = pluginInfo.header ?? titleCaseWord(pureIdentifier);
  renderInfo = shallowCopy(renderInfo);
  const px = 12;
  const py = 8;
  const gap = 4;
  const iconWH = 48;
  const nx = Math.trunc((renderInfo.w - px * 2 - iconWH) / (iconWH + gap)) + 1;
  const pivot = renderInfo.pivot;
  renderInfo.expandProps ??= {};
  renderInfo.expandProps.p ??= "0px";
  renderInfo.expandProps.boxShadow ??= "2px 2px 4px rgba(0, 0, 0, 0.25)";
  const getOffset = (i: number) => i * iconWH + Math.max(0, i - 1) * gap;
  const emitClose = useClosePanel(id);

  return (
    <Render id={id} isGroup renderInfo={renderInfo} {...props}>
      <Box w="100%" h="100%" px={`${px}px`} py={`${py}px`}>
        <Flex>
          <CFHeading>{header}</CFHeading>
          <Spacer />
          <CloseIcon w="12px" cursor="pointer" onClick={emitClose} />
        </Flex>
        <CFDivider mb="8px" />
        {pluginInfo.plugins.map((settings, i) => {
          settings = shallowCopy(settings);
          settings.props.groupId = id;
          settings.props.renderInfo.pivot = pivot;
          settings.props.renderInfo.iconW = iconWH;
          settings.props.renderInfo.iconH = iconWH;
          settings.props.renderInfo.offsetX = getOffset(i % nx);
          settings.props.renderInfo.offsetY = getOffset(Math.trunc(i / nx));
          return makePlugin({
            key: `${pureIdentifier}_${settings.props.pluginInfo.identifier}`,
            containerRef: props.containerRef,
            ...settings,
          });
        })}
      </Box>
    </Render>
  );
};

drawboardPluginFactory.registerPython("_python.pluginGroup", true)(observer(PythonPluginGroup));
