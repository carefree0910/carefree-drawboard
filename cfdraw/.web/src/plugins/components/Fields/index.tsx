import { ReactElement, useMemo } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";

import { argMin, range, shallowCopy } from "@carefree0910/core";

import type { IDefinitions } from "@/schema/fields";
import { DEFAULT_GAP } from "@/utils/constants";
import { getFieldH } from "./utils";
import { Field } from "./Field";
import ListField from "./ListField";

interface IDefinitionsComponent extends FlexProps {
  definitions: IDefinitions;
  numColumns?: number;
  rowGap?: number;
}
export function Definitions({ definitions, numColumns, rowGap, ...others }: IDefinitionsComponent) {
  const nc = numColumns ?? 1;
  const gap = rowGap ?? DEFAULT_GAP;

  const columnW = useMemo(
    () => (numColumns === 1 ? "100%" : `${(100 - 5 * (nc - 1)) / nc}%`),
    [nc],
  );

  const entries = Object.entries(shallowCopy(definitions));
  if (entries.length === 0) return null;

  const columns: ReactElement[][] = range(0, nc).map(() => []);
  const heights = columns.map(() => 0);
  entries.forEach(([field, definition]) => {
    let FieldComponent;
    if (definition.type !== "list") {
      FieldComponent = <Field key={field} field={field} definition={definition} gap={gap} />;
    } else {
      FieldComponent = <ListField key={field} field={field} definition={definition} gap={gap} />;
    }
    const fieldH = getFieldH({ gap, definition, field });
    const columnIdx = argMin(heights);
    heights[columnIdx] += fieldH + gap;
    columns[columnIdx].push(FieldComponent);
  });

  return (
    <Flex p="12px" flexWrap="wrap" alignItems="center" justifyContent="space-around" {...others}>
      {columns.map((column, idx) => (
        <Flex
          key={idx}
          w={columnW}
          h="100%"
          gap={`${gap}px`}
          flexDirection="column"
          alignItems="center"
          justifyContent="flex-start">
          {column}
        </Flex>
      ))}
    </Flex>
  );
}
