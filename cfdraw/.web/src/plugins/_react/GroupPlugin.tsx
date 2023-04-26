import { useMemo } from "react";
import { observer } from "mobx-react-lite";

import { getRandomHash } from "@carefree0910/core";
import { useSelecting } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import Render from "../components/Render";
import { drawboardPluginFactory } from "../utils/factory";

const GroupEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `groupEditor_${getRandomHash()}`, []);
  const { unGroup } = useSelecting("group") ?? {};
  return <Render id={id} onFloatingButtonClick={async () => unGroup?.()} {...props} />;
};
const MultiEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `multiEditor_${getRandomHash()}`, []);
  const { setGroup } = useSelecting("multiple") ?? {};
  return <Render id={id} onFloatingButtonClick={async () => setGroup?.()} {...props} />;
};

drawboardPluginFactory.register("groupEditor", true)(observer(GroupEditorPlugin));
drawboardPluginFactory.register("multiEditor", true)(observer(MultiEditorPlugin));
