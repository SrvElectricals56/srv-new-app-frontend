import Constants from 'expo-constants';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type SmsRetriever = typeof import('@pushpendersingh/react-native-otp-verify');

// SMS Retriever needs a native Android build and an SMS containing that build's app hash.
// Expo Go and iOS continue to use the TextInput OTP autofill hint.
export function useSmsOtpAutofill(onCode: (code: string) => void) {
  const onCodeRef = useRef(onCode);
  const moduleRef = useRef<SmsRetriever | null>(null);
  const subscriptionRef = useRef<{ remove(): void } | null>(null);
  const generationRef = useRef(0);
  onCodeRef.current = onCode;

  useEffect(() => () => {
    generationRef.current += 1;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    void moduleRef.current?.removeSmsListener().catch(() => {});
  }, []);

  return useCallback(async () => {
    if (Platform.OS !== 'android' || Constants.executionEnvironment === 'storeClient') return;
    const generation = ++generationRef.current;
    try {
      const retriever = await import('@pushpendersingh/react-native-otp-verify');
      if (generation !== generationRef.current) return;
      moduleRef.current = retriever;
      subscriptionRef.current?.remove();
      subscriptionRef.current = retriever.addSmsListener(({ status, message }) => {
        if (generation !== generationRef.current || status !== 'success' || !message) return;
        const code = retriever.extractOtp(message, 4);
        if (!code) return;
        onCodeRef.current(code);
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
        void retriever.removeSmsListener().catch(() => {});
      });
      await retriever.startSmsRetriever();
    } catch {
      // Manual entry and the operating system's OTP suggestion remain available.
      if (generation === generationRef.current) {
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
      }
    }
  }, []);
}
