import { ReactElement, useMemo } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";

import { argMin, isUndefined, range, shallowCopy } from "@carefree0910/core";

import type { IDefinitions, IFieldDefinition } from "@/schema/fields";
import TextField from "./TextField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import BooleanField from "./BooleanField";

interface IFieldComponent {
  field: string;
  definition: IFieldDefinition;
  gap: number;
}
function getFieldH({ field, definition, gap }: IFieldComponent): number {
  const defaultH = 42;

  // calculate height, in order to place the field in the shortest column (if needed)
  let fieldH;
  const props = definition.props ?? {};
  if (!isUndefined(props.h)) {
    if (!props.h.endsWith("px")) {
      throw Error(`Field '${field}' height must be in px`);
    }
    fieldH = parseInt(props.h.slice(0, -2));
  } else {
    const numRows = definition.numRows ?? 1;
    fieldH = defaultH * numRows + gap * (numRows - 1);
  }
  return fieldH;
}
export function Field({ field, definition, gap }: IFieldComponent) {
  let Field: any;
  if (definition.type === "text") {
    Field = TextField;
  } else if (definition.type === "number") {
    Field = NumberField;
  } else if (definition.type === "select") {
    Field = SelectField;
  } else if (definition.type === "boolean") {
    Field = BooleanField;
  }
  if (!Field) return null;
  const props = definition.props ?? {};
  if (isUndefined(props.w)) props.w = "100%";
  if (isUndefined(props.h)) props.h = `${getFieldH({ field, definition, gap })}px`;
  definition.props = props;
  return <Field field={field} definition={definition} />;
}

interface IDefinitionsComponent extends FlexProps {
  definitions: IDefinitions;
  numColumns?: number;
  rowGap?: number;
}
export function Definitions({ definitions, numColumns, rowGap, ...others }: IDefinitionsComponent) {
  const nc = numColumns ?? 1;
  const gap = rowGap ?? 12;

  const columnW = useMemo(
    () => (numColumns === 1 ? "100%" : `${(100 - 5 * (nc - 1)) / nc}%`),
    [nc],
  );

  const entries = Object.entries(shallowCopy(definitions));
  if (entries.length === 0) return null;

  const columns: ReactElement[][] = range(0, nc).map(() => []);
  const heights = columns.map(() => 0);
  entries.forEach(([field, definition]) => {
    const FieldComponent = <Field key={field} field={field} definition={definition} gap={gap} />;
    const fieldH = getFieldH({ field, definition, gap });
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
