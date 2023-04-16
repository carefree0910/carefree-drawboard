import { v4 as uuidv4 } from "uuid";
import { makeObservable, observable, runInAction } from "mobx";

import { ABCStore } from "@carefree0910/business";

import { formatTime } from "@/utils/misc";

export interface IProjectsStore {
  uid: string;
  name: string;
  createTime: number;
  updateTime: number;
}
type IPartialProjectsStore = Partial<IProjectsStore>;
class ProjectsStore extends ABCStore<IPartialProjectsStore> implements IPartialProjectsStore {
  uid?: string;
  name?: string;
  createTime?: number;
  updateTime?: number;

  constructor() {
    super();
    makeObservable(this, {
      uid: observable,
      name: observable,
    });
  }

  get info(): IPartialProjectsStore {
    return this;
  }
}

const projectsStore = new ProjectsStore();
export const getNewProject = (): IProjectsStore => {
  const time = new Date().getTime();
  return {
    uid: uuidv4(),
    name: `Project ${formatTime(time, "YYYY-MM-DD HH:mm").slice(2)}`,
    createTime: time / 1000,
    updateTime: time / 1000,
  };
};
export const setCurrentProjectName = (name: string) => projectsStore.updateProperty("name", name);
export const useCurrentProject = (): IProjectsStore => {
  if (!projectsStore.uid) {
    projectsStore.updateProperty(getNewProject());
  }
  return {
    uid: projectsStore.uid!,
    name: projectsStore.name!,
    createTime: projectsStore.createTime!,
    updateTime: projectsStore.updateTime!,
  };
};
export const updateCurrentProjectUpdateTime = () =>
  projectsStore.updateProperty("updateTime", new Date().getTime() / 1000);
export const updateCurrentProject = (data: IProjectsStore) => projectsStore.updateProperty(data);
