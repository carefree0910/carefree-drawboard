import { useEffect } from "react";
import { makeObservable, observable } from "mobx";

import { isUndefined } from "@carefree0910/core";
import { ABCStore, BoardStore, useIsReady } from "@carefree0910/business";

import { setPluginExpanded, usePluginParent, usePluginsExpanded } from "@/stores/pluginsInfo";
import { collapseAllPlugins } from "@/actions/managePlugins";

// helpers

function smartCollapse(): void {
  const currentExpanded = usePluginsExpanded();
  const expanding = Object.keys(currentExpanded).find((key) => currentExpanded[key]);
  collapseAllPlugins({ except: ["brush"] });
  if (!isUndefined(expanding)) {
    const parent = usePluginParent(expanding);
    if (!isUndefined(parent)) {
      setPluginExpanded(parent, true);
    }
  }
}

// pointer

class PointerEventManager {
  constructor(private isPointerDown: boolean = false) {}

  get container() {
    return BoardStore.board.container;
  }

  onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    if (e.target === this.container) {
      pointerEventStore.updateProperty("interactingWithBoard", true);
      smartCollapse();
    }
  };
  onPointerMove = (e: PointerEvent) => {
    if ((!e.target || e.target !== this.container) && this.isPointerDown) {
      this.isPointerDown = false;
      this.onPointerUp(e);
    }
  };
  onPointerUp = (e: PointerEvent) => {
    this.isPointerDown = false;
    pointerEventStore.updateProperty("interactingWithBoard", false);
  };
}
interface IPointerEventsStore {
  interactingWithBoard: boolean;
}
class PointerEventsStore extends ABCStore<IPointerEventsStore> implements IPointerEventsStore {
  interactingWithBoard: boolean = false;

  constructor() {
    super();
    makeObservable(this, {
      interactingWithBoard: observable,
    });
  }

  get info(): IPointerEventsStore {
    return this;
  }
}
const pointerManager = new PointerEventManager();
const pointerEventStore = new PointerEventsStore();

// keyboard

function onEsc(e: KeyboardEvent) {
  if (e.key === "Escape") {
    smartCollapse();
  }
}

// api
export const isInteractingWithBoard = () => pointerEventStore.interactingWithBoard;
export const useDocumentEvents = () => {
  const isReady = useIsReady();

  useEffect(() => {
    if (!isReady) return;
    document.addEventListener("pointerdown", pointerManager.onPointerDown);
    document.addEventListener("pointermove", pointerManager.onPointerMove);
    document.addEventListener("pointerup", pointerManager.onPointerUp);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("pointerdown", pointerManager.onPointerDown);
      document.removeEventListener("pointermove", pointerManager.onPointerMove);
      document.removeEventListener("pointerup", pointerManager.onPointerUp);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isReady]);
};
