import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Button, Divider, useToast } from "@chakra-ui/react";

import { langStore } from "@noli/business";

import type { IInternalTaskPlugin } from "@/types/plugins";
import type { ISubscribableFields } from "@/types/metaFields";
import { themeStore } from "@/stores/theme";
import { importMeta } from "@/actions/importMeta";
import { CFDivider } from "@/components/CFDivider";
import { subscribe } from "../utils/subscribe";
import Render from "./Render";
import TextField from "./TextField";

const TaskPlugin = ({ node, task, fields, customDefinitions, ...props }: IInternalTaskPlugin) => {
  const definitions = useMemo(() => subscribe(fields, customDefinitions), []);

  const t = useToast();
  const lang = langStore.tgt;
  const { textColor } = themeStore.styles;

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
      <CFDivider />
      <Button color={textColor} flexShrink={0} onClick={onSubmit}>
        Submit
      </Button>
    </Render>
  );
};

export default observer(TaskPlugin);
