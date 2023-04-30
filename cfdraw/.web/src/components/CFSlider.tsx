import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Flex,
  FlexProps,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useUnmount } from "ahooks";
import React, { useCallback, useEffect, useState } from "react";

import { themeStore } from "@/stores/theme";
import { CFCaption } from "./CFText";
import CFInput from "./CFInput";
import CFTooltip from "./CFTooltip";

export interface ICFSlider extends FlexProps {
  className?: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  scale?: "linear" | "logarithmic";
  label?: string;
  tooltip?: string;
  onSliderChange(value: number): void;
  precision?: number;
}

const CFSlider: React.FC<ICFSlider> = ({
  className,
  min,
  max,
  value,
  step = 0.01,
  scale = "linear",
  label,
  tooltip,
  onSliderChange,
  precision = 2,
  ...props
}) => {
  const [val, setVal] = useState(value ?? 0);
  const [inputVal, setInputVal] = useState<string>(value?.toString() ?? "0");
  const [iptFocused, setIptFocused] = useState(false);
  const offset = scale === "linear" || min > 0 ? 0 : -min + 1;

  const handleSliderChange = useCallback(
    (v: number) => {
      if (scale === "logarithmic") {
        v = Math.pow(Math.E, v) - offset;
      }
      v = +v.toFixed(precision);
      setVal(v);
      onSliderChange(v);
    },
    [setVal, onSliderChange],
  );

  const inputValueFormatter = useCallback(
    (input: number) => {
      let val = input;
      if (val <= min) {
        val = min;
      } else if (val >= max) {
        val = max;
      } else {
        if ((val % step) / step < 0.5) {
          val = val - (val % step);
        } else {
          val = val + (step - (val % step));
        }
        val = +val.toFixed(precision);
      }
      return val;
    },
    [min, max],
  );

  const handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      setInputVal(e.target.value);
    },
    [setInputVal],
  );

  const handleInputBlur = useCallback(
    (inputVal: number) => {
      setIptFocused(false);
      const val = inputValueFormatter(inputVal);
      setInputVal(val.toString());
      setVal(val);
      onSliderChange(val);
    },
    [onSliderChange, setVal, setInputVal, setIptFocused, inputValueFormatter],
  );

  const handleInputPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.code === "Enter") {
        const val = inputValueFormatter(+e.currentTarget.value);
        setInputVal(val.toString());
        setVal(val);
        onSliderChange(val);
      }
    },
    [onSliderChange, setVal, setInputVal, inputValueFormatter],
  );

  // controlled
  useEffect(() => {
    if (typeof value === "number") {
      if (value !== val) {
        setVal(value);
      }
      if (value.toString() !== inputVal) {
        setInputVal(value.toFixed(precision).toString());
      }
    }
  }, [value]);

  useUnmount(() => {
    handleInputBlur(+inputVal);
  });

  const {
    textColor,
    sliderColors: { sliderTrackColor, sliderThumbBorderColor, inputBgColor },
  } = themeStore.styles;

  return (
    <Flex className={className} align="center" color={textColor} {...props}>
      <CFTooltip label={tooltip}>
        <CFCaption label={label} />
      </CFTooltip>
      <Slider
        focusThumbOnChange={!iptFocused}
        flex={1}
        h="32px"
        mx="1em"
        value={scale === "linear" ? val : Math.log(val + offset)}
        min={scale === "linear" ? min : Math.log(min + offset)}
        max={scale === "linear" ? max : Math.log(max + offset)}
        color="#333"
        fontSize="12px"
        step={step}
        onChange={handleSliderChange}>
        <SliderTrack h="2px">
          <SliderFilledTrack bg={sliderTrackColor} />
        </SliderTrack>
        <SliderThumb
          boxSize={3}
          border="2px solid"
          borderColor={sliderThumbBorderColor}
          _focusVisible={{ boxShadow: "none" }}></SliderThumb>
      </Slider>
      <CFInput
        w="50px"
        bg={inputBgColor}
        type="number"
        h="28px"
        size="unset"
        p={0}
        textAlign="center"
        fontSize="14px"
        border="none"
        borderRadius="4px"
        _focusVisible={{ boxShadow: "none" }}
        value={inputVal}
        onFocus={() => setIptFocused(true)}
        onBlur={(e) => handleInputBlur(+e.target.value)}
        onKeyDown={handleInputPress}
        onChange={handleInputChange}
      />
    </Flex>
  );
};

export default observer(CFSlider);
