import { computed, makeObservable, observable } from "mobx";

import type { IPathOptions } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

type ThemeType = "light" | "dark";
type ThemeStyles = {
  // bg color of the infinite drawboard
  boardBg: string;
  // bg color of various panels (button, floating, expand, etc.)
  panelBg: string;
  // color of the text
  textColor: string;
  // color of the caption
  captionColor: string;
  // color of the divider
  dividerColor: string;
  // colors of the `CFSelect` component
  selectColors: {
    color: string;
    bgColor: string;
    hoverBgColor: string;
    checkedColor: string;
    hoverBorderColor: string;
    activeBorderColor: string;
  };
  // colors of the `CFSlider` component
  sliderColors: {
    sliderTrackColor: string;
    sliderThumbBorderColor: string;
    inputBgColor: string;
  };
  // styles for the `CFSwitch` component
  switchColors: {
    checkedBgColor: string;
    uncheckedBgColor: string;
  };
  // styles for the `brush`
  defaultBrushStyles: Partial<IPathOptions>;
};

export const allThemes: Record<ThemeType, ThemeStyles> = {
  light: {
    boardBg: "#f7f7f7",
    panelBg: "#f9f9f9",
    textColor: "#333333",
    captionColor: "#888888",
    dividerColor: "#cccccc",
    selectColors: {
      color: "#333333",
      bgColor: "#f0f0f0",
      hoverBgColor: "#f9f9f9",
      checkedColor: "#3ad822",
      hoverBorderColor: "#bbbbbb",
      activeBorderColor: "#999999",
    },
    sliderColors: {
      sliderTrackColor: "#3ad822",
      sliderThumbBorderColor: "#3fc9a8",
      inputBgColor: "#eeeeee",
    },
    switchColors: {
      checkedBgColor: "#3fc9a8",
      uncheckedBgColor: "#dddddd",
    },
    defaultBrushStyles: {
      stroke: "rgba(96, 120, 244, 0.6)",
      fill: "rgba(96, 120, 244, 0.4)",
      width: 3,
    },
  },
  // currently dark mode is just a placeholder
  dark: {
    boardBg: "#242424",
    panelBg: "#f9f9f9",
    textColor: "#333333",
    captionColor: "#888888",
    dividerColor: "#cccccc",
    selectColors: {
      color: "#333333",
      bgColor: "#f0f0f0",
      hoverBgColor: "#f9f9f9",
      checkedColor: "#3ad822",
      hoverBorderColor: "#bbbbbb",
      activeBorderColor: "#999999",
    },
    sliderColors: {
      sliderTrackColor: "#3ad822",
      sliderThumbBorderColor: "#3fc9a8",
      inputBgColor: "#eeeeee",
    },
    switchColors: {
      checkedBgColor: "#3fc9a8",
      uncheckedBgColor: "#dddddd",
    },
    defaultBrushStyles: {
      stroke: "rgba(96, 120, 244, 0.7)",
      fill: "rgba(96, 120, 244, 0.7)",
      width: 3,
    },
  },
};

export interface IThemeStore {
  theme: ThemeType;
}
class ThemeStore extends ABCStore<IThemeStore> implements IThemeStore {
  theme: ThemeType = "light";

  constructor() {
    super();
    makeObservable(this, {
      theme: observable,
      styles: computed,
    });
  }

  get info(): IThemeStore {
    return this;
  }

  get styles(): ThemeStyles {
    return allThemes[this.theme];
  }
}

export const themeStore = new ThemeStore();
export const updateTheme = (theme: ThemeType) => themeStore.updateProperty("theme", theme);
