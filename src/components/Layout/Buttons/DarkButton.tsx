import React, { FunctionComponent, ReactNode } from "react";
import { Text } from "react-native";
import { color, fontSize } from "../../../common/styles";
import { BaseButton } from "./BaseButton";

export interface DarkButton {
  onPress?: () => void;
  text: ReactNode;
  fullWidth?: boolean;
}

export const DarkButton: FunctionComponent<DarkButton> = ({
  onPress,
  text,
  fullWidth = false
}) => (
  <BaseButton
    onPress={onPress}
    backgroundColor={color("blue", 50)}
    fullWidth={fullWidth}
  >
    <Text
      style={{
        color: color("grey", 0),
        fontWeight: "bold",
        fontSize: fontSize(0)
      }}
    >
      {text}
    </Text>
  </BaseButton>
);
