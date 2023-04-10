import { Lang } from "@noli/core";

export enum Projects_Words {
  "project-header" = "project-header",
  "save-project" = "save-project",
  "load-project" = "load-project",
  "get-available-projects" = "get-available-projects",
}

export const projectsLangRecords: Record<Lang, Record<Projects_Words, string>> = {
  zh: {
    [Projects_Words["project-header"]]: "项目管理",
    [Projects_Words["save-project"]]: "保存项目",
    [Projects_Words["load-project"]]: "加载项目",
    [Projects_Words["get-available-projects"]]: "获取所有项目",
  },
  en: {
    [Projects_Words["project-header"]]: "Project Management",
    [Projects_Words["save-project"]]: "Save Project",
    [Projects_Words["load-project"]]: "Load Project",
    [Projects_Words["get-available-projects"]]: "Get Available Projects",
  },
};
