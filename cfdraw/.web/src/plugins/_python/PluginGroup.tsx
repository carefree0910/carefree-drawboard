import { observer } from "mobx-react-lite";
import { Box, Flex, Spacer } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

import { shallowCopy } from "@carefree0910/core";
import { CFDivider, CFHeading } from "@carefree0910/components";

import { IPythonPluginGroup } from "@/schema/_python";
import { titleCaseWord } from "@/utils/misc";
import { usePluginIds } from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import { drawboardPluginFactory } from "../utils/factory";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";
import MakePlugin from "..";

const PythonPluginGroup = ({ pluginInfo, renderInfo, ...props }: IPythonPluginGroup) => {
  const { id, pureIdentifier } = usePluginIds(pluginInfo.identifier);
  const header = parseIStr(pluginInfo.header ?? titleCaseWord(pureIdentifier));
  renderInfo = shallowCopy(renderInfo);
  const p = 12;
  const gap = 4;
  const iconWH = 48;
  const nx = Math.trunc((renderInfo.w - p * 2 - iconWH) / (iconWH + gap)) + 1;
  renderInfo.expandProps ??= {};
  renderInfo.expandProps.p ??= "0px";
  renderInfo.expandProps.boxShadow ??= "2px 2px 4px rgba(0, 0, 0, 0.25)";
  const getOffset = (i: number) => i * (iconWH + gap);
  const emitClose = useClosePanel(id);

  return (
    <Render isGroup id={id} renderInfo={renderInfo} {...props}>
      <Box w="100%" h="100%" p={`${p}px`}>
        <Flex>
          <CFHeading>{header}</CFHeading>
          <Spacer />
          <CloseIcon w="12px" cursor="pointer" onClick={emitClose} />
        </Flex>
        <CFDivider mb="8px" />
        {pluginInfo.plugins.map((settings, i) => {
          settings = shallowCopy(settings);
          settings.props.groupId = id;
          settings.props.nodeConstraint ??= props.nodeConstraint;
          settings.props.nodeConstraintRules ??= props.nodeConstraintRules;
          settings.props.nodeConstraintValidator ??= props.nodeConstraintValidator;
          settings.props.renderInfo.pivot = renderInfo.pivot;
          settings.props.renderInfo.expandPivot ??= renderInfo.expandPivot;
          settings.props.renderInfo.iconW = iconWH;
          settings.props.renderInfo.iconH = iconWH;
          settings.props.renderInfo.offsetX = getOffset(i % nx);
          settings.props.renderInfo.offsetY = getOffset(Math.trunc(i / nx));
          settings.props.renderInfo.expandOffsetX = renderInfo.expandOffsetX;
          settings.props.renderInfo.expandOffsetY = renderInfo.expandOffsetY;
          return (
            <MakePlugin
              key={`${pureIdentifier}_${settings.props.pluginInfo.identifier}`}
              containerRef={props.containerRef}
              {...settings}
            />
          );
        })}
      </Box>
    </Render>
  );
};

drawboardPluginFactory.registerPython("_python.pluginGroup", true)(observer(PythonPluginGroup));
