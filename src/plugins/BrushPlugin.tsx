import { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useToast } from "@chakra-ui/react";
import { runInAction } from "mobx";

import { IPathOptions, Lang, getRandomHash } from "@noli/core";
import { BoardStore, langStore, toolbarStore, translate, updateBrushOptions } from "@noli/business";

import type { IToast } from "@/schema/misc";
import type { ICommonMetaData, IMeta } from "@/schema/meta";
import type { IPlugin } from "@/schema/plugins";
import { toast } from "@/utils/toast";
import { Brush_Words } from "@/lang/brush";
import { Toast_Words } from "@/lang/toast";
import { VisibleManager, uiStore } from "@/stores/ui";
import { themeStore } from "@/stores/theme";
import { hideAllPlugins } from "@/actions/managePlugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";
import CFButton from "@/components/CFButton";
import CFSlider from "@/components/CFSlider";
import CFSwitch from "@/components/CFSwitch";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { floatingControlEvent } from "./components/Floating";

const useSwitchBrushMode = (t: IToast, lang: Lang) => async (): Promise<void> => {
  const { defaultBrushStyles } = themeStore.styles;
  const previousInBrushMode = toolbarStore.inBrushMode;
  // handle drawboard
  if (!previousInBrushMode) {
    toast(t, "success", translate(Toast_Words["enter-brush-mode-message"], lang));
    toolbarStore.switchBrushMode(defaultBrushStyles);
  } else {
    toolbarStore.switchBrushMode({
      nodeCallback: (node) => {
        toast(t, "success", translate(Toast_Words["exit-brush-mode-message"], lang));
        node.active = true;
        node.params.meta = {
          type: "add.sketch.path",
          data: { timestamp: Date.now() },
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
      hideAllPlugins({ except: ["brush"] });
    } else {
      uiStore.disablePluginSettings = false;
      VisibleManager.restoreVisibleBackup();
    }
  });
};

function SingleBrushEditor({
  lang,
  pathIndex,
  options,
}: {
  lang: Lang;
  pathIndex: number;
  options: IPathOptions;
}) {
  const brushManager = BoardStore.board.brushPluginNullable;
  if (!brushManager) {
    return null;
  }
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
  const id = useMemo(() => `brush_${getRandomHash()}`, []);
  const t = useToast();
  const lang = langStore.tgt;
  const options = toolbarStore.allBrushOptions;
  const inBrushMode = toolbarStore.inBrushMode;
  const switchBrushMode = useSwitchBrushMode(t, lang);
  const optionsList = !options ? [] : Array.isArray(options) ? options : [options];

  useEffect(() => {
    if (inBrushMode) {
      floatingControlEvent.emit({ id, expand: true });
    }
  });

  return (
    <Render id={id} onFloatingButtonClick={switchBrushMode} {...props}>
      <CFHeading>{translate(Brush_Words["brush-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      {optionsList.map((opt, i) => (
        <SingleBrushEditor key={`brush-${i}`} lang={lang} pathIndex={i} options={opt} />
      ))}
      <CFDivider my="16px" />
      <CFButton
        isDisabled={!inBrushMode}
        onClick={() => {
          floatingControlEvent.emit({ id, expand: false });
          switchBrushMode();
        }}>
        {translate(Brush_Words["finish-brush-message"], lang)}
      </CFButton>
    </Render>
  );
};
drawboardPluginFactory.register("brush")(observer(BrushPlugin));
