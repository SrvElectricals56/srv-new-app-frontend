import { forwardRef, useContext, type ReactNode } from 'react';
import { Alert, Animated, Text, TextInput, type TextInstance, type TextInputInstance, type TextProps, type TextInputProps } from 'react-native';
import { PreferenceContext, translateUiText, getCurrentAppLanguage } from './index';

function localizeChildren(children: ReactNode, tx: (text: string) => string): ReactNode {
  if (typeof children === 'string') return tx(children);
  if (Array.isArray(children)) return children.map(child => localizeChildren(child, tx));
  return children;
}

export type LocalizedText = TextInstance;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- Preserve the native component's instance type for refs.
export const LocalizedText = forwardRef<TextInstance, TextProps>(function LocalizedText(props, ref) {
  const preferences = useContext(PreferenceContext);
  const tx = preferences?.tx ?? ((text: string) => text);
  return <Text {...props} ref={ref} accessibilityLabel={props.accessibilityLabel ? tx(props.accessibilityLabel) : undefined}>{localizeChildren(props.children, tx)}</Text>;
});

export type LocalizedTextInput = TextInputInstance;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- Preserve the native component's instance type for refs.
export const LocalizedTextInput = forwardRef<TextInputInstance, TextInputProps>(function LocalizedTextInput(props, ref) {
  const preferences = useContext(PreferenceContext);
  const tx = preferences?.tx ?? ((text: string) => text);
  return <TextInput {...props} ref={ref} placeholder={props.placeholder ? tx(props.placeholder) : undefined} accessibilityLabel={props.accessibilityLabel ? tx(props.accessibilityLabel) : undefined} />;
});

export const LocalizedAnimatedText = Animated.createAnimatedComponent(LocalizedText);
export const LocalizedAlert = {
  ...Alert,
  alert: ((title, message, buttons, options) => {
    const tx = (text: string) => translateUiText(getCurrentAppLanguage(), text);
    Alert.alert(title ? tx(title) : title, message ? tx(message) : message, buttons?.map(button => ({ ...button, text: button.text ? tx(button.text) : button.text })), options);
  }) as typeof Alert.alert,
};
