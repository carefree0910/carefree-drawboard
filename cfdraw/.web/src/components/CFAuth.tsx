import React, { useEffect, useState, PropsWithChildren, ReactElement } from "react";

import { Logger } from "@carefree0910/core";

import { Event } from "@/utils/event";

type Message = {
  userId: string;
};

const allowedOrigins = ["http://127.0.0.1:9527", "http://localhost:9527"];
const allowedOriginRegexList = [/^http:\/\/localhost(:\d+)?$/];

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginRegexList.some((regex) => regex.test(origin));
}

interface ICFAuthGuard {
  loadingPage?: ReactElement;
}

export const authEvent = new Event<Message>();
export const CFAuthGuard: React.FC<PropsWithChildren<ICFAuthGuard>> = ({
  loadingPage,
  children,
}) => {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const onMessage = (e: MessageEvent<Partial<Message>>) => {
      if (!isAllowedOrigin(e.origin)) {
        Logger.error(`unauthorized origin: ${e.origin}`);
        return;
      }
      if (e.data.userId) {
        setAccepted(true);
        authEvent.emit({ userId: e.data.userId });
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return <>{accepted ? children : loadingPage}</>;
};
