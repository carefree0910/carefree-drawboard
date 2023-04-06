import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Button, Divider, useToast } from "@chakra-ui/react";

import { Logger } from "@noli/core";
import { langStore } from "@noli/business";

import type { ITaskPlugin } from "@/types/plugins";
import type { ISubscribableFields } from "@/types/metaFields";
import { subscribe } from "./utils/subscribe";
import { themeStore } from "@/stores/theme";
import TextField from "@/components/TextField";
import { importMeta } from "@/actions/importMeta";
import Render from "./utils/Render";

const TaskPlugin = observer(({ task, fields, customDefinitions, ...props }: ITaskPlugin) => {
  const definitions = useMemo(() => subscribe(fields, customDefinitions), []);

  const t = useToast();
  const lang = langStore.tgt;
  const { textColor, dividerColor } = themeStore.styles;

  async function onSubmit() {
    importMeta({ t, lang, type: task });
  }

  return (
    <Render {...props}>
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
    </Render>
  );
});

export function makeTaskPlugin(props: ITaskPlugin) {
  if (props.follow && props.nodeConstraint === "none") {
    Logger.warn("cannot use `follow` with `targetNodeType` set to `none`");
    return null;
  }
  return <TaskPlugin {...props} />;
}
