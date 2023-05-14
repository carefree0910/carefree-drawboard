import { v4 as uuidv4 } from "uuid";
import { makeObservable, observable } from "mobx";

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
  uid?: string = undefined;
  name?: string = undefined;
  createTime?: number = undefined;
  updateTime?: number = undefined;

  constructor() {
    super();
    makeObservable(this, {
      uid: observable,
      name: observable,
      createTime: observable,
      updateTime: observable,
    });
  }

  get info(): IPartialProjectsStore {
    return this;
  }
}

const projectsStore = new ProjectsStore();
export function getTimeString(time: number): string {
  return formatTime(time, "YYYY-MM-DD HH:mm").slice(2);
}
export const getNewProjectInfo = (): IProjectsStore => {
  const time = new Date().getTime();
  return {
    uid: uuidv4(),
    name: `Project ${getTimeString(time)}`,
    createTime: time / 1000,
    updateTime: time / 1000,
  };
};
export const setCurrentProjectName = (name: string) => projectsStore.updateProperty("name", name);
export const useCurrentProjectInfo = (): IProjectsStore => {
  if (!projectsStore.uid) {
    projectsStore.updateProperty(getNewProjectInfo());
  }
  return {
    uid: projectsStore.uid!,
    name: projectsStore.name!,
    createTime: projectsStore.createTime!,
    updateTime: projectsStore.updateTime!,
  };
};
export const getNewUpdateTime = () => new Date().getTime() / 1000;
export const updateCurrentProjectUpdateTime = () =>
  projectsStore.updateProperty("updateTime", getNewUpdateTime());
export const updateCurrentProjectInfo = (data: IProjectsStore) =>
  projectsStore.updateProperty(data);
