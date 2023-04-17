import { ReactNode } from "react";
import { UseToastOptions } from "@chakra-ui/toast";

import type { IToast } from "@/schema/misc";

export function toast(
  toastFn: IToast,
  status: UseToastOptions["status"],
  message: ReactNode,
  duration?: number | null,
): void {
  toastFn({
    position: "top",
    title: message,
    status,
    isClosable: true,
    duration:
      typeof duration === "undefined"
        ? status === "error"
          ? 6000
          : status === "warning"
          ? 5000
          : 3000
        : duration,
    containerStyle: {
      width: "400px",
    },
  });
}
