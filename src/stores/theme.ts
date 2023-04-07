import { computed, makeObservable, observable } from "mobx";

import { ABCStore } from "@noli/business";

type ThemeType = "light" | "dark";
type ThemeStyles = {
  // bg color of the infinite drawboard
  boardBg: string;
  // bg color of various panels (button, floating, expand, etc.)
  panelBg: string;
  // color of the text
  textColor: string;
  // color of the divider
  dividerColor: string;
};

export const allThemes: Record<ThemeType, ThemeStyles> = {
  light: {
    boardBg: "#f7f7f7",
    panelBg: "#f9f9f9",
    textColor: "#333333",
    dividerColor: "#cccccc",
  },
  // currently dark mode is just a placeholder
  dark: {
    boardBg: "#242424",
    panelBg: "#f9f9f9",
    textColor: "#333333",
    dividerColor: "#cccccc",
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
