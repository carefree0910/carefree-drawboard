import { ReactNode } from "react";
import { makeObservable, observable } from "mobx";
import { UseToastOptions } from "@chakra-ui/toast";

import { isUndefined } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { IToast } from "@/schema/misc";
import { settingsStore } from "@/stores/settings";

export interface IToastStore {
  timer: any;
  shouldTerminate: boolean;
}
class ToastStore extends ABCStore<IToastStore> implements IToastStore {
  timer: any;
  shouldTerminate: boolean = false;

  constructor() {
    super();
    makeObservable(this, {
      timer: observable,
      shouldTerminate: observable,
    });
  }

  get info(): IToastStore {
    return this;
  }
}

export const toastStore = new ToastStore();

export function toast(
  toastFn: IToast,
  status: UseToastOptions["status"],
  message: ReactNode,
  opt?: { duration?: number; timeout?: number; useToastOptions?: UseToastOptions },
): void {
  const _toast = () => {
    if (toastStore.shouldTerminate) {
      toastStore.updateProperty("shouldTerminate", false);
      return;
    }
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
    _toast();
    clearTimeout(toastStore.timer);
    toastStore.updateProperty("shouldTerminate", true);
  }
}
