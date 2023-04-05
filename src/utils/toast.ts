import { ReactNode } from "react";
import { useToast, UseToastOptions } from "@chakra-ui/toast";

export function toast(
  toastFn: ReturnType<typeof useToast>,
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
