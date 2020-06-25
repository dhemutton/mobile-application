import React, {
  useState,
  useEffect,
  FunctionComponent,
  Dispatch,
  SetStateAction
} from "react";
import { View, StyleSheet, Alert } from "react-native";
import { DarkButton } from "../Layout/Buttons/DarkButton";
import { SecondaryButton } from "../Layout/Buttons/SecondaryButton";
import { size, fontSize } from "../../common/styles";
import { Card } from "../Layout/Card";
import { AppText } from "../Layout/AppText";
import { InputWithLabel } from "../Layout/InputWithLabel";
import { LoginStage } from "./types";
import { NavigationProps } from "../../types";
import { useAuthenticationContext } from "../../context/auth";
import { validateOTP, requestOTP } from "../../services/auth";

const RESEND_OTP_TIME_LIMIT = 30 * 1000;

const styles = StyleSheet.create({
  inputAndButtonWrapper: {
    marginTop: size(3)
  },
  buttonsWrapper: {
    marginTop: size(2),
    flexDirection: "row",
    alignItems: "center"
  },
  resendCountdownText: { marginRight: size(1), fontSize: fontSize(-2) },
  submitWrapper: {
    flex: 1,
    marginLeft: size(1)
  }
});

interface LoginOTPCard extends NavigationProps {
  setLoginStage: Dispatch<SetStateAction<LoginStage>>;
  mobileNumber: string;
  codeKey: string;
  endpoint: string;
}

export const LoginOTPCard: FunctionComponent<LoginOTPCard> = ({
  navigation,
  setLoginStage,
  mobileNumber,
  codeKey,
  endpoint
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [oTPValue, setOTPValue] = useState("");
  const [resendDisabledTime, setResendDisabledTime] = useState(
    RESEND_OTP_TIME_LIMIT
  );
  const [resendWarningMessage, setResendWarningMessage] = useState("");
  const { setAuthInfo } = useAuthenticationContext();

  useEffect(() => {
    const resendTimer = setTimeout(() => {
      if (resendDisabledTime <= 0) {
        clearTimeout(resendTimer);
      } else {
        setResendDisabledTime(resendDisabledTime - 1000);
      }
    }, 1000);

    return () => {
      if (resendTimer) {
        clearTimeout(resendTimer);
      }
    };
  }, [resendDisabledTime]);

  const checkLockedOut = (e: any): void => {
    if (e && typeof e === "string") {
      if (e.indexOf("Please wait") !== -1) setLoginStage("MOBILE_NUMBER");
    } else if (e && e.message && typeof e.message === "string") {
      if (e.message.indexOf("Please wait") !== -1)
        setLoginStage("MOBILE_NUMBER");
    }
  };

  const onValidateOTP = async (otp: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await validateOTP(otp, mobileNumber, codeKey, endpoint);
      setIsLoading(false);
      setAuthInfo(response.sessionToken, response.ttl.getTime(), endpoint);
      navigation.navigate("CollectCustomerDetailsScreen");
    } catch (e) {
      setIsLoading(false);
      Alert.alert(
        "Error",
        e.message || e,
        [{ text: "OK", onPress: () => checkLockedOut(e.message || e) }],
        {
          cancelable: false
        }
      );
    }
  };

  const onSubmitOTP = (): void => {
    onValidateOTP(oTPValue);
  };

  const resendOTP = async (): Promise<void> => {
    setIsResending(true);
    try {
      const res: any = await requestOTP(mobileNumber, codeKey, endpoint);
      if (res && res.message && typeof res.message === "string") {
        setResendWarningMessage(res.message);
      }
      setIsResending(false);
      setResendDisabledTime(RESEND_OTP_TIME_LIMIT);
    } catch (e) {
      setIsResending(false);
      Alert.alert(
        "Error",
        e.message || e,
        [{ text: "OK", onPress: () => checkLockedOut(e.message || e) }],
        {
          cancelable: false
        }
      );
    }
  };

  const alertBeforeResend = (): void => {
    Alert.alert(
      "Resend OTP?",
      resendWarningMessage,
      [
        {
          text: "RESEND",
          onPress: async () => {
            await resendOTP();
            setResendWarningMessage("");
          }
        },
        { text: "CANCEL" }
      ],
      { cancelable: false }
    );
  };

  const handleChange = (text: string): void => {
    /^\d*$/.test(text) && setOTPValue(text);
  };

  return (
    <Card>
      <AppText>We&apos;re sending you the one-time password...</AppText>
      <View style={styles.inputAndButtonWrapper}>
        <InputWithLabel
          label="OTP"
          value={oTPValue}
          onChange={({ nativeEvent: { text } }) => handleChange(text)}
          onSubmitEditing={onSubmitOTP}
          keyboardType="numeric"
        />
        <View style={styles.buttonsWrapper}>
          {resendDisabledTime > 0 ? (
            <AppText style={styles.resendCountdownText}>
              Resend in {resendDisabledTime / 1000}s
            </AppText>
          ) : (
            <SecondaryButton
              text="Resend"
              onPress={
                resendWarningMessage === "" ? resendOTP : alertBeforeResend
              }
              isLoading={isResending}
              disabled={isLoading}
            />
          )}
          <View style={styles.submitWrapper}>
            <DarkButton
              text="Submit"
              fullWidth
              onPress={onSubmitOTP}
              isLoading={isLoading}
              disabled={isResending}
            />
          </View>
        </View>
      </View>
    </Card>
  );
};
