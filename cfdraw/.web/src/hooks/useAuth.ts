import { useEffect } from "react";

import { Event } from "@/utils/event";

type Message = {
  userId: string;
};

const allowedOrigins = ["http://127.0.0.1:5123", "http://localhost:5123"];
const allowedOriginRegexList = [/^http:\/\/localhost(:\d+)?$/, /^https:\/\/.*nolibox\.com$/];

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginRegexList.some((regex) => regex.test(origin));
}

export const authEvent = new Event<Message>();
export const useAuth = () => {
  useEffect(() => {
    const onMessage = (e: MessageEvent<Partial<Message>>) => {
      if (!isAllowedOrigin(e.origin)) {
        console.error(`unauthorized origin: ${e.origin}`);
        return;
      }
      if (e.data.userId) {
        authEvent.emit({ userId: e.data.userId });
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);
};
