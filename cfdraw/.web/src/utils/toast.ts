import { ReactNode } from "react";
import { makeObservable, observable } from "mobx";
import { createStandaloneToast, UseToastOptions } from "@chakra-ui/toast";

import { isUndefined } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import { settingsStore } from "@/stores/settings";

export interface IToastStore {
  timer: any;
}
class ToastStore extends ABCStore<IToastStore> implements IToastStore {
  timer: any;

  constructor() {
    super();
    makeObservable(this, {
      timer: observable,
    });
  }

  get info(): IToastStore {
    return this;
  }
}

const { toast: toastFn } = createStandaloneToast();
export const toastStore = new ToastStore();

export function toast(
  status: UseToastOptions["status"],
  message: ReactNode,
  opt?: { duration?: number; timeout?: number; useToastOptions?: UseToastOptions },
): void {
  const _toast = () => {
    toastFn({
      position: "top",
      title: message,
      status,
      isClosable: true,
      duration: isUndefined(duration)
        ? status === "error"
          ? 6000
          : status === "warning"
          ? 5000
          : 3000
        : duration,
      containerStyle: {
        width: "400px",
      },
      ...useToastOptions,
    });
  };

  let { duration, timeout, useToastOptions } = opt ?? {};
  if (status === "info" && isUndefined(timeout)) {
    timeout = settingsStore.defaultInfoTimeout;
  }
  if (!isUndefined(timeout)) {
    toastStore.updateProperty("timer", setTimeout(_toast, timeout));
  } else {
    clearTimeout(toastStore.timer);
    _toast();
  }
}
