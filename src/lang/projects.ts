import { Lang } from "@noli/core";

export enum Projects_Words {
  "project-plugin-header" = "project-plugin-header",
  "current-project-name" = "current-project-name",
  "save-project" = "save-project",
  "load-project" = "load-project",
  "load-local-project" = "load-local-project",
  "get-available-projects" = "get-available-projects",
  "no-projects-available" = "no-projects-available",
  "loading-available-project" = "loading-available-project",
}

export const projectsLangRecords: Record<Lang, Record<Projects_Words, string>> = {
  zh: {
    [Projects_Words["project-plugin-header"]]: "项目管理",
    [Projects_Words["current-project-name"]]: "当前名称",
    [Projects_Words["save-project"]]: "保 存",
    [Projects_Words["load-project"]]: "加 载",
    [Projects_Words["load-local-project"]]: "加载本地",
    [Projects_Words["get-available-projects"]]: "获取所有项目",
    [Projects_Words["no-projects-available"]]: "暂无项目",
    [Projects_Words["loading-available-project"]]: "拉取项目中...",
  },
  en: {
    [Projects_Words["project-plugin-header"]]: "Project Management",
    [Projects_Words["current-project-name"]]: "Current Name",
    [Projects_Words["save-project"]]: "Save",
    [Projects_Words["load-project"]]: "Load",
    [Projects_Words["load-local-project"]]: "Load Local",
    [Projects_Words["get-available-projects"]]: "Get Available Projects",
    [Projects_Words["no-projects-available"]]: "No Projects Available",
    [Projects_Words["loading-available-project"]]: "Loading...",
  },
};
