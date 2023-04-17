import React, { useMemo } from "react";
import { chakra } from "@chakra-ui/react";
import classnames from "classnames";

import "./index.scss";
import { genBlock } from "@/utils/bem";

export type SvgIcon = React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

export interface IconProps {
  svg: SvgIcon;
  squared?: boolean;
  className?: string;
  disabled?: boolean;
  fillbyCurrentColor?: boolean;
  strokeByCurrentColor?: boolean;
  fillAll?: boolean;
  style?: React.CSSProperties;
  attrs?: React.SVGAttributes<SVGSVGElement>;
  fontSize?: string;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

const block = genBlock("c-icon");

const CFIcon: React.FC<IconProps> = ({
  svg: Svg,
  squared,
  className,
  disabled,
  fillbyCurrentColor,
  strokeByCurrentColor,
  fillAll,
  style,
  attrs = {},
  fontSize,
  onClick,
}) => {
  const _style = useMemo(() => {
    const styleObj = { ...style };
    if (typeof fontSize === "string") {
      styleObj.fontSize = fontSize;
    }
    return styleObj;
  }, [style, fontSize]);

  return (
    <Svg
      className={classnames(block({ e: squared ?? true ? "squared" : undefined }), className, {
        [block({ m: "disabled" })]: disabled,
        [block({ m: "fill-all" })]: fillAll,
        [block({ m: "fill-current-color" })]: fillbyCurrentColor,
        [block({ m: "stroke-current-color" })]: strokeByCurrentColor,
      })}
      onClick={onClick}
      style={_style}
      {...attrs}
    />
  );
};

export default chakra(CFIcon);
