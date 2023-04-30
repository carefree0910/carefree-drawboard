import { ReactElement, useMemo } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";

import { argMin, isUndefined, range, shallowCopy } from "@carefree0910/core";

import type { IDefinitions } from "@/schema/fields";
import TextField from "./TextField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import BooleanField from "./BooleanField";

interface IUseDefinitions extends FlexProps {
  definitions: IDefinitions;
  numColumns?: number;
  rowGap?: number;
}
export function useDefinitions({ definitions, numColumns, rowGap, ...others }: IUseDefinitions) {
  const nc = numColumns ?? 1;
  const gap = rowGap ?? 12;
  const defaultH = 42;
  const columnW = useMemo(
    () => (numColumns === 1 ? "100%" : `${(100 - 5 * (nc - 1)) / nc}%`),
    [nc],
  );
  const columns: ReactElement[][] = range(0, nc).map(() => []);
  const heights = columns.map(() => 0);
  definitions = shallowCopy(definitions);
  Object.entries(definitions).forEach(([field, definition]) => {
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
    if (!Field) return;
    const props = definition.props ?? {};
    if (isUndefined(props.w)) props.w = "100%";
    // calculate height, in order to place the field in the shortest column
    let FieldH;
    if (!isUndefined(props.h)) {
      if (!props.h.endsWith("px")) {
        throw Error(`Field '${field}' height must be in px`);
      }
      FieldH = parseInt(props.h.slice(0, -2));
    } else {
      const numRows = definition.numRows ?? 1;
      FieldH = defaultH * numRows + gap * (numRows - 1);
      props.h = `${FieldH}px`;
    }
    definition.props = props;
    const columnIdx = argMin(heights);
    heights[columnIdx] += FieldH + gap;
    columns[columnIdx].push(<Field key={field} field={field} definition={definition} />);
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
