import { useMemo, useLayoutEffect } from "react";
import { observer } from "mobx-react-lite";
import { Button, Divider, useToast } from "@chakra-ui/react";

import { Coordinate, getRandomHash, Logger, PivotType } from "@noli/core";
import {
  boardBBoxToDom,
  BoardStore,
  injectNodeTransformEventCallback,
  langStore,
  removeNodeTransformEventCallback,
  useBoardContainerLeftTop,
  useSelectHooks,
  useSelecting,
} from "@noli/business";

import type { TaskTypes } from "@/types/tasks";
import type { ICustomDefinitions, ISubscribableFields } from "@/types/metaFields";
import { subscribe } from "./subscribe";
import { getNodeFilter, TargetNodeType } from "./renderFilters";
import { themeStore } from "@/stores/theme";
import TextField from "@/components/TextField";
import Floating, { floatingEvent, IFloating, IFloatingEvent } from "@/components/Floating";
import { importMeta } from "@/actions/importMeta";

export interface IPlugin extends Omit<IFloating, "id"> {
  task: TaskTypes;
  fields: ISubscribableFields[];
  targetNodeType: TargetNodeType;
  customDefinitions?: ICustomDefinitions;
  pivot?: PivotType;
  follow?: boolean;
  paddingX?: number;
  paddingY?: number;
}

const Plugin = observer(
  ({
    task,
    fields,
    targetNodeType,
    customDefinitions,
    pivot,
    follow,
    paddingX,
    paddingY,
    ...props
  }: IPlugin) => {
    const id = useMemo(() => `plugin_${getRandomHash()}`, []);
    const definitions = useMemo(() => subscribe(fields, customDefinitions), []);

    const t = useToast();
    const lang = langStore.tgt;
    const { textColor, dividerColor } = themeStore.styles;

    /**
     * This effect handles callbacks that dynamically render the plugin's position
     *
     * > we use `useLayoutEffect` here and use `useEffect` in `Floating` to make sure
     * the following code is executed before `Floating`'s `useEffect`
     */
    useLayoutEffect(() => {
      const updateFloating = async () => {
        const _follow = follow ?? false;
        const _pivot = pivot ?? "bottom";
        const _paddingX = paddingX ?? 8;
        const _paddingY = paddingY ?? 8;
        const domFloating = document.querySelector<HTMLDivElement>(`#${id}`);
        if (!domFloating) return;
        let x, y;
        if (!_follow) {
          const { x: left, y: top } = useBoardContainerLeftTop();
          const { w: bw, h: bh } = BoardStore.board.wh;
          // x
          if (["lt", "left", "lb"].includes(_pivot)) {
            x = left + _paddingX;
          } else if (["rt", "right", "rb"].includes(_pivot)) {
            x = left + bw - props.w - _paddingX;
          } else {
            x = left + (bw - props.w) / 2;
          }
          // y
          if (["lt", "top", "rt"].includes(_pivot)) {
            y = top + _paddingY;
          } else if (["lb", "bottom", "rb"].includes(_pivot)) {
            y = top + bh - props.h - _paddingY;
          } else {
            y = top + (bh - props.h) / 2;
          }
        } else {
          const info = useSelecting("basic")({ fixed: 0 });
          if (!info || !info.displayNode || (props.renderFilter && !props.renderFilter(info))) {
            return;
          }
          const domPivot = boardBBoxToDom(info.displayNode.bbox.bounding).pivot(_pivot);
          let offsetX, offsetY;
          // x
          if (["lt", "left", "lb"].includes(_pivot)) {
            offsetX = -props.w - _paddingX;
          } else if (["rt", "right", "rb"].includes(_pivot)) {
            offsetX = _paddingX;
          } else {
            offsetX = -0.5 * props.w;
          }
          // y
          if (["lt", "top", "rt"].includes(_pivot)) {
            offsetY = -props.h - _paddingY;
          } else if (["lb", "bottom", "rb"].includes(_pivot)) {
            offsetY = _paddingY;
          } else {
            offsetY = -0.5 * props.h;
          }
          ({ x, y } = domPivot.add(new Coordinate(offsetX, offsetY)));
        }
        domFloating.style.transform = `matrix(1,0,0,1,${x},${y})`;
      };
      const onFloatingFirstRender = ({ id: renderedId, needRender }: IFloatingEvent) => {
        if (id === renderedId && needRender) {
          updateFloating();
          floatingEvent.off(onFloatingFirstRender);
        }
      };
      floatingEvent.on(onFloatingFirstRender);
      injectNodeTransformEventCallback(id, updateFloating);
      useSelectHooks().register({ key: id, after: updateFloating });
      updateFloating();

      return () => {
        removeNodeTransformEventCallback(id);
        useSelectHooks().remove(id);
      };
    }, [targetNodeType, customDefinitions, pivot, follow, paddingX, paddingY]);

    async function onSubmit() {
      importMeta({ t, lang, type: task });
    }

    return (
      <Floating id={id} renderFilter={getNodeFilter(targetNodeType)} {...props}>
        {Object.entries(definitions).map(([field, definition]) => {
          if (definition.type === "text") {
            return (
              <TextField
                key={field}
                field={field as ISubscribableFields}
                definition={definition}
                flexShrink={0}
                {...definition.props}
              />
            );
          }
          return null;
        })}
        <Divider my="12px" borderColor={dividerColor} />
        <Button color={textColor} flexShrink={0} onClick={onSubmit}>
          Submit
        </Button>
      </Floating>
    );
  },
);

export function makePlugin(props: IPlugin) {
  if (props.follow && props.targetNodeType === "all") {
    Logger.warn("cannot use `follow` with `targetNodeType` set to `all`");
    return null;
  }
  return <Plugin {...props} />;
}
