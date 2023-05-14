import { useEffect } from "react";
import { makeObservable, observable } from "mobx";

import { ABCStore, BoardStore, useIsReady } from "@carefree0910/business";

import { collapseAllPlugins } from "@/actions/managePlugins";

class PointerEventManager {
  constructor(private isPointerDown: boolean = false) {}

  get container() {
    return BoardStore.board.container;
  }

  onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    if (e.target === this.container) {
      pointerEventStore.updateProperty("interactingWithBoard", true);
      collapseAllPlugins();
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

const manager = new PointerEventManager();
const pointerEventStore = new PointerEventsStore();

export const isInteractingWithBoard = () => pointerEventStore.interactingWithBoard;
export const usePointerEvents = () => {
  const isReady = useIsReady();

  useEffect(() => {
    if (!isReady) return;
    document.addEventListener("pointerdown", manager.onPointerDown);
    document.addEventListener("pointermove", manager.onPointerMove);
    document.addEventListener("pointerup", manager.onPointerUp);

    return () => {
      document.removeEventListener("pointerdown", manager.onPointerDown);
      document.removeEventListener("pointermove", manager.onPointerMove);
      document.removeEventListener("pointerup", manager.onPointerUp);
    };
  }, [isReady]);
};
