import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

export interface IGridLinesStore {
  enable: boolean;
  lineWidth: number;
  // should be of format r,g,b (e.g. 208,208,208)
  lineColor: string;
  maxOpacity: number;
  maxGridSize: number;
  /**
   * The larger the `span`, the little the minimum grid size will be
   *
   * !!!   So don't set it too large, or the grid lines will be   !!!
   * !!!         too dense and also hurt performance              !!!
   */
  span: number;
  /**
   * When should we start draw sub grids, it shoud be within [minFraction, 1]
   *
   * > minFraction === 1.0 / span
   * > #`span` sub grids will construct a larger grid
   * > the larger this value, the more often we draw sub grids
   */
  startSubGridsFraction: number;
}
class GridLinesStore extends ABCStore<IGridLinesStore> implements IGridLinesStore {
  enable = true;
  lineWidth = 1;
  lineColor = "208,208,208";
  maxOpacity = 0.8;
  maxGridSize = 250;
  span = 4;
  startSubGridsFraction = 0.45;

  constructor() {
    super();
    makeObservable(this, {
      enable: observable,
      lineWidth: observable,
      lineColor: observable,
      maxOpacity: observable,
      maxGridSize: observable,
      span: observable,
      startSubGridsFraction: observable,
    });
  }

  get info(): IGridLinesStore {
    return this;
  }
}

export const gridlinesStore = new GridLinesStore();
