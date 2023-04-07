import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Flex,
  Text,
  Input,
} from "@chakra-ui/react";
import { useUnmount } from "ahooks";
import React, { ReactElement, useCallback, useEffect, useState } from "react";

interface SliderProps {
  className?: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  scale?: "linear" | "logarithmic";
  label?: string | ReactElement;
  onChange(val: number): void;
  precision?: number;
}

const CFSlider: React.FC<SliderProps> = ({
  className,
  min,
  max,
  value,
  step = 0.01,
  scale = "linear",
  label,
  onChange,
  precision = 2,
}) => {
  const [val, setVal] = useState(value ?? 0);
  const [inputVal, setInputVal] = useState<string>(value?.toString() ?? "0");
  const [iptFocused, setIptFocused] = useState(false);

  const handleSliderChange = useCallback(
    (v: number) => {
      if (scale === "logarithmic") {
        v = Math.pow(Math.E, v);
      }
      v = +v.toFixed(precision);
      setVal(v);
      onChange(v);
    },
    [setVal, onChange],
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
      onChange(val);
    },
    [onChange, setVal, setInputVal, setIptFocused, inputValueFormatter],
  );

  const handleInputPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.code === "Enter") {
        const val = inputValueFormatter(+e.currentTarget.value);
        setInputVal(val.toString());
        setVal(val);
        onChange(val);
      }
    },
    [onChange, setVal, setInputVal, inputValueFormatter],
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

  return (
    <Flex className={className} align="center" color="white">
      <Text fontSize="14px">{label}</Text>
      <Slider
        focusThumbOnChange={!iptFocused}
        flex={1}
        h="32px"
        mx="1em"
        value={scale === "linear" ? val : Math.log(val)}
        min={scale === "linear" ? min : Math.log(min)}
        max={scale === "linear" ? max : Math.log(max)}
        color="#333"
        fontSize="12px"
        step={step}
        onChange={handleSliderChange}>
        <SliderTrack h="2px">
          <SliderFilledTrack bg="brand.primary" />
        </SliderTrack>
        <SliderThumb
          boxSize={3}
          border="2px solid"
          borderColor="#3fc9a8"
          _focusVisible={{ boxShadow: "none" }}></SliderThumb>
      </Slider>
      <Input
        w="50px"
        bg="#464646"
        type="number"
        h="24px"
        size="unset"
        p={0}
        textAlign="center"
        fontSize="14px"
        border="none"
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

export default CFSlider;
