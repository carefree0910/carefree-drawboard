import { useEffect } from "react";

import type { IUserStore } from "@/stores/user";
import { Event } from "@/utils/event";
import { cleanURL, getEnv } from "@/utils/misc";

const allowedOrigins = ["http://127.0.0.1:5123", "http://localhost:5123"];
const allowedOriginRegexList = [/^http:\/\/localhost(:\d+)?$/];
let envAllowedOrigins = getEnv("CFDRAW_ALLOWED_ORIGINS");
if (!envAllowedOrigins) {
  // THIS IS DANGEROUS, but will be convenient for quick deployment
  envAllowedOrigins = window.location.origin;
}
allowedOrigins.push(...envAllowedOrigins.split(",").map(cleanURL));

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginRegexList.some((regex) => regex.test(origin));
}

export const authEvent = new Event<IUserStore>();
export const useAuth = () => {
  useEffect(() => {
    const onMessage = (e: MessageEvent<IUserStore | any>) => {
      if (!!e.data.userId) {
        console.log("> incoming user message:", e);
      }
      if (!isAllowedOrigin(e.origin)) {
        console.error(`unauthorized origin: ${e.origin}`);
        return;
      }
      if (!!e.data.userId) {
        authEvent.emit(e.data);
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);
};
