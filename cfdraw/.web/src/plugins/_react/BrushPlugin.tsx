import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";

import { IPathOptions } from "@carefree0910/core";
import {
  BoardStore,
  langStore,
  toolbarStore,
  translate,
  updateBrushOptions,
} from "@carefree0910/business";
import {
  CFButton,
  CFSlider,
  CFSwitch,
  CFDivider,
  CFHeading,
  toastWord,
} from "@carefree0910/components";

import type { ICommonMetaData, IMeta } from "@/schema/meta";
import type { IPlugin } from "@/schema/plugins";
import { Brush_Words } from "@/lang/brush";
import { CFDraw_Toast_Words } from "@/lang/toast";
import { themeStore } from "@/stores/theme";
import { VisibleManager, uiStore } from "@/stores/ui";
import { setPluginExpanded, usePluginIds } from "@/stores/pluginsInfo";
import { hideAllPlugins } from "@/actions/managePlugins";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const useSwitchBrushMode = () => async (): Promise<void> => {
  const { defaultBrushStyles } = themeStore.styles;
  const previousInBrushMode = toolbarStore.inBrushMode;
  // handle drawboard
  if (!previousInBrushMode) {
    toastWord("success", CFDraw_Toast_Words["enter-brush-mode-message"]);
    toolbarStore.switchBrushMode(defaultBrushStyles);
  } else {
    toolbarStore.switchBrushMode({
      nodeCallback: (node) => {
        toastWord("success", CFDraw_Toast_Words["exit-brush-mode-message"]);
        node.active = true;
        node.params.meta = {
          type: "add.sketch.path",
          data: { elapsedTimes: { endTime: Date.now() } },
        } as IMeta<ICommonMetaData>;
      },
    });
  }
  // handle plugin visibilities
  runInAction(() => {
    const inBrushMode = !previousInBrushMode;
    if (inBrushMode) {
      uiStore.disablePluginSettings = true;
      VisibleManager.updateVisibleBackup();
      hideAllPlugins({ exceptReactPlugins: ["brush"] });
    } else {
      uiStore.disablePluginSettings = false;
      VisibleManager.restoreVisibleBackup();
    }
  });
};

function SingleBrushEditor({ pathIndex, options }: { pathIndex: number; options: IPathOptions }) {
  const brushManager = BoardStore.board.brushPluginNullable;
  if (!brushManager) {
    return null;
  }

  const lang = langStore.tgt;
  const { fill, stroke, width, linecap } = options;

  const setOpt = (opt: Partial<IPathOptions>) => {
    updateBrushOptions({ fill, stroke, width, linecap, ...opt, index: pathIndex });
  };

  const setColor = (color: string) => setOpt({ stroke: color, fill: color });
  const setWidth = (value: number) => setOpt({ width: value });
  const setUseFill = (use: boolean) => setOpt({ fill: use ? stroke : "none" });

  return (
    <>
      <CFSlider
        min={1}
        max={256}
        value={width}
        scale="logarithmic"
        label={translate(Brush_Words["brush-width-label"], lang)}
        onSliderChange={(value) => setWidth(value)}
      />
      <CFSwitch
        mt="12px"
        label={translate(Brush_Words["brush-use-fill-label"], lang)}
        value={fill !== "none"}
        setValue={setUseFill}
        formLabelProps={{ ml: "6px" }}
      />
    </>
  );
}

const BrushPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("brush").id;

  const lang = langStore.tgt;
  const options = toolbarStore.allBrushOptions;
  const inBrushMode = toolbarStore.inBrushMode;
  const switchBrushMode = useSwitchBrushMode();
  const optionsList = !options ? [] : Array.isArray(options) ? options : [options];

  useEffect(() => {
    if (inBrushMode) {
      setPluginExpanded(id, true);
    }
  }, [inBrushMode]);

  return (
    <Render id={id} onFloatingButtonClick={switchBrushMode} {...props}>
      <CFHeading>{translate(Brush_Words["brush-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      {optionsList.map((opt, i) => (
        <SingleBrushEditor key={`brush-${i}`} pathIndex={i} options={opt} />
      ))}
      <CFDivider my="16px" />
      <CFButton
        isDisabled={!inBrushMode}
        onClick={() => {
          setPluginExpanded(id, false);
          switchBrushMode();
        }}>
        {translate(Brush_Words["finish-brush-message"], lang)}
      </CFButton>
    </Render>
  );
};
drawboardPluginFactory.register("brush", true)(observer(BrushPlugin));
