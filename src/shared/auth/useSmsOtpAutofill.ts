import { isRunningInExpoGo } from 'expo';
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

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => () => {
    generationRef.current += 1;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    void moduleRef.current?.removeSmsListener().catch(() => {});
  }, []);

  return useCallback(async () => {
    if (Platform.OS !== 'android' || isRunningInExpoGo()) return;
    const generation = ++generationRef.current;
    try {
      const retriever = await import('@pushpendersingh/react-native-otp-verify');
      if (generation !== generationRef.current) return;
      moduleRef.current = retriever;

      // A resend must replace the previous five-minute receiver. Keeping the
      // old native receiver alive can make the next start look successful while
      // its event is still attached to the previous OTP request.
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      await retriever.removeSmsListener().catch(() => {});
      await retriever.startSmsRetriever();
      if (generation !== generationRef.current) {
        await retriever.removeSmsListener().catch(() => {});
        return;
      }

      subscriptionRef.current = retriever.addSmsListener(({ status, message }) => {
        if (generation !== generationRef.current) return;
        if (status !== 'success' || !message) {
          subscriptionRef.current?.remove();
          subscriptionRef.current = null;
          void retriever.removeSmsListener().catch(() => {});
          return;
        }
        const code = retriever.extractOtp(message, 4);
        if (!code) return;
        onCodeRef.current(code);
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
        void retriever.removeSmsListener().catch(() => {});
      });
    } catch {
      // Manual entry and the operating system's OTP suggestion remain available.
      if (generation === generationRef.current) {
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
      }
    }
  }, []);
}
