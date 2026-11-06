import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/shared/preferences/LocalizedNative';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File as ExpoFile, UploadType } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { api } from '@/shared/api';
import { API_BASE_URL } from '@/shared/api/config';
import { usePreferenceContext, type AppLanguage } from '@/shared/preferences';
import { openWhatsAppSupport } from '@/shared/utils/whatsapp';
import { getSpeechProfile, prepareSpeechText, selectBestSpeechVoice } from '@/shared/utils/nativeSpeech';

type Message = { id: number; role: 'user' | 'assistant'; content: string };
type ChatResponse = { reply: string; supportWhatsApp: string };
type VoicePhase = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'error';

const COPY: Record<AppLanguage, {
  welcome: string; hint: string; placeholder: string; support: string; qr: string; products: string; hello: string;
  error: string; setup: string; thinking: string; disclosure: string; record: string; stop: string; voiceError: string;
  listening: string; processing: string; voiceReady: string; sendVoice: string; discardVoice: string;
  voiceTitle: string; voiceSpeaking: string; voicePaused: string; voiceHint: string; interrupt: string; privacy: string;
  mute: string; resume: string; end: string;
}> = {
  English: {
    welcome: 'Hi! I’m SRV Chat. Ask me about SRV products, QR scans, rewards, or just say hello.',
    hint: 'Your SRV helper, here anytime', placeholder: 'Ask SRV Chat anything…', support: 'WhatsApp support',
    qr: 'My QR is not scanning', products: 'Tell me about SRV products', hello: 'Hey, how are you?',
    error: 'I could not reply right now. Please try again or contact SRV support.',
    setup: 'AI replies are being set up on the server. SRV support can help you now.',
    thinking: 'SRV Chat is thinking…', disclosure: 'Replies use AI; spoken replies use your phone voice. Do not share OTPs or passwords.',
    record: 'Record voice message', stop: 'Stop recording', voiceError: 'Could not process the voice message. Please try again.',
    listening: 'Listening… stop when you finish speaking', processing: 'Processing your voice message…',
    voiceReady: 'Voice message ready', sendVoice: 'Send voice message', discardVoice: 'Discard voice message',
    voiceTitle: 'Voice with SRV Chat', voiceSpeaking: 'SRV Chat is speaking…', voicePaused: 'Microphone paused',
    voiceHint: 'Speak naturally. I’ll reply when you pause.', interrupt: 'Tap the orb to interrupt',
    privacy: 'AI can make mistakes. Never share an OTP or password.', mute: 'Pause', resume: 'Resume', end: 'End',
  },
  Hindi: {
    welcome: 'नमस्ते! मैं SRV Chat हूँ। प्रोडक्ट, QR स्कैन, रिवॉर्ड्स या किसी भी सवाल के बारे में पूछें।',
    hint: 'आपका SRV सहायक', placeholder: 'SRV Chat से कुछ भी पूछें…', support: 'WhatsApp सहायता',
    qr: 'मेरा QR स्कैन नहीं हो रहा', products: 'SRV प्रोडक्ट बताइए', hello: 'नमस्ते, कैसे हो?',
    error: 'अभी जवाब नहीं दे पा रहा हूँ। फिर कोशिश करें या SRV सहायता से संपर्क करें।',
    setup: 'सर्वर पर AI सेवा सेट हो रही है। अभी SRV सहायता से संपर्क करें।',
    thinking: 'SRV Chat सोच रहा है…', disclosure: 'जवाब AI देता है; आवाज़ आपके फ़ोन से आती है। OTP या पासवर्ड साझा न करें।',
    record: 'आवाज़ रिकॉर्ड करें', stop: 'रिकॉर्डिंग रोकें', voiceError: 'आवाज़ समझ नहीं आई। फिर कोशिश करें।',
    listening: 'सुन रहा हूँ… बोलने के बाद स्टॉप दबाएँ', processing: 'आपकी आवाज़ समझ रहा हूँ…',
    voiceReady: 'वॉइस मैसेज तैयार है', sendVoice: 'वॉइस मैसेज भेजें', discardVoice: 'वॉइस मैसेज हटाएँ',
    voiceTitle: 'SRV Chat से आवाज़ में बात करें', voiceSpeaking: 'SRV Chat बोल रहा है…', voicePaused: 'माइक्रोफ़ोन रुका हुआ है',
    voiceHint: 'सामान्य तरीके से बोलें। रुकने पर मैं जवाब दूँगा।', interrupt: 'बीच में बोलने के लिए गोले को दबाएँ',
    privacy: 'AI से गलती हो सकती है। OTP या पासवर्ड कभी साझा न करें।', mute: 'रोकें', resume: 'फिर शुरू करें', end: 'बंद करें',
  },
  Punjabi: {
    welcome: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ SRV Chat ਹਾਂ। ਪ੍ਰੋਡਕਟ, QR ਸਕੈਨ, ਰਿਵਾਰਡ ਜਾਂ ਹੋਰ ਕੋਈ ਸਵਾਲ ਪੁੱਛੋ।',
    hint: 'ਤੁਹਾਡਾ SRV ਸਹਾਇਕ', placeholder: 'SRV Chat ਨੂੰ ਕੁਝ ਵੀ ਪੁੱਛੋ…', support: 'WhatsApp ਮਦਦ',
    qr: 'ਮੇਰਾ QR ਸਕੈਨ ਨਹੀਂ ਹੋ ਰਿਹਾ', products: 'SRV ਪ੍ਰੋਡਕਟ ਦੱਸੋ', hello: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਕੀ ਹਾਲ ਹੈ?',
    error: 'ਹੁਣੇ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਦਾ। ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ SRV ਮਦਦ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
    setup: 'ਸਰਵਰ ਤੇ AI ਸੇਵਾ ਸੈੱਟ ਹੋ ਰਹੀ ਹੈ। ਹੁਣੇ SRV ਮਦਦ ਨਾਲ ਗੱਲ ਕਰੋ।',
    thinking: 'SRV Chat ਸੋਚ ਰਿਹਾ ਹੈ…', disclosure: 'ਜਵਾਬ AI ਦਿੰਦਾ ਹੈ; ਆਵਾਜ਼ ਤੁਹਾਡੇ ਫ਼ੋਨ ਤੋਂ ਆਉਂਦੀ ਹੈ। OTP ਜਾਂ ਪਾਸਵਰਡ ਨਾ ਦਿਓ।',
    record: 'ਆਵਾਜ਼ ਰਿਕਾਰਡ ਕਰੋ', stop: 'ਰਿਕਾਰਡਿੰਗ ਰੋਕੋ', voiceError: 'ਆਵਾਜ਼ ਸਮਝ ਨਹੀਂ ਆਈ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    listening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ… ਬੋਲਣ ਤੋਂ ਬਾਅਦ ਸਟਾਪ ਦਬਾਓ', processing: 'ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸਮਝ ਰਿਹਾ ਹਾਂ…',
    voiceReady: 'ਵੌਇਸ ਮੈਸੇਜ ਤਿਆਰ ਹੈ', sendVoice: 'ਵੌਇਸ ਮੈਸੇਜ ਭੇਜੋ', discardVoice: 'ਵੌਇਸ ਮੈਸੇਜ ਹਟਾਓ',
    voiceTitle: 'SRV Chat ਨਾਲ ਆਵਾਜ਼ ਵਿੱਚ ਗੱਲ ਕਰੋ', voiceSpeaking: 'SRV Chat ਬੋਲ ਰਿਹਾ ਹੈ…', voicePaused: 'ਮਾਈਕ ਰੁਕਿਆ ਹੋਇਆ ਹੈ',
    voiceHint: 'ਆਰਾਮ ਨਾਲ ਬੋਲੋ। ਤੁਹਾਡੇ ਰੁਕਣ ਤੇ ਮੈਂ ਜਵਾਬ ਦਿਆਂਗਾ।', interrupt: 'ਵਿਚਕਾਰ ਬੋਲਣ ਲਈ ਗੋਲੇ ਨੂੰ ਦਬਾਓ',
    privacy: 'AI ਤੋਂ ਗਲਤੀ ਹੋ ਸਕਦੀ ਹੈ। OTP ਜਾਂ ਪਾਸਵਰਡ ਕਦੇ ਸਾਂਝਾ ਨਾ ਕਰੋ।', mute: 'ਰੋਕੋ', resume: 'ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ', end: 'ਬੰਦ ਕਰੋ',
  },
};

function ChatIcon({ size = 25 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M6 6.5h16a3 3 0 013 3v9a3 3 0 01-3 3H12l-5.5 3v-3H6a3 3 0 01-3-3v-9a3 3 0 013-3z" stroke="white" strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M14 9.5l-1.1 3.4-3.4 1.1 3.4 1.1L14 18.5l1.1-3.4 3.4-1.1-3.4-1.1L14 9.5z" fill="white" />
      <Circle cx="21" cy="5" r="2" fill="#66E6F7" />
    </Svg>
  );
}

function MicIcon({ color = '#52637D', size = 21 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15.2a3.7 3.7 0 003.7-3.7V6.7a3.7 3.7 0 10-7.4 0v4.8a3.7 3.7 0 003.7 3.7z" fill={color} />
      <Path d="M5.8 11.2a6.2 6.2 0 0012.4 0M12 17.4v3.1M9.1 20.5h5.8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function VoiceSendIcon({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 3L10.4 13.6M21 3l-6.7 18-3.9-7.4L3 9.7 21 3z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SrvChatLauncher({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      testID="srv-chat-launcher"
      accessibilityRole="button"
      accessibilityLabel="Open SRV Chat"
      onPress={onPress}
      // Keep the launcher clear of checkout/action buttons while leaving it
      // close enough to the Account tab to remain discoverable.
      style={[styles.launcher, { bottom: Math.max(88, insets.bottom + 78) }]}
    >
      <LinearGradient colors={['#123B87', '#4F4CCC', '#8860D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.launcherFill}>
        <ChatIcon size={22} />
      </LinearGradient>
    </Pressable>
  );
}

export function SrvChatModal({ visible, onClose, supportWhatsApp }: {
  visible: boolean; onClose: () => void; supportWhatsApp?: string | null;
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { language: appLanguage } = usePreferenceContext();
  const [language, setLanguage] = useState<AppLanguage>(appLanguage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceModeVisible, setVoiceModeVisible] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle');
  const [voicePaused, setVoicePaused] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 300);
  const nextId = useRef(1);
  const recordingRef = useRef(false);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const closedRef = useRef(false);
  const speechDetectedRef = useRef(false);
  const silenceStartedRef = useRef<number | null>(null);
  const voiceModeActiveRef = useRef(false);
  const voicePausedRef = useRef(false);
  const voiceStartingRef = useRef(false);
  const voiceFinishingRef = useRef(false);
  const copy = COPY[language];

  useEffect(() => () => {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    voiceModeActiveRef.current = false;
    uploadControllerRef.current?.abort();
    if (recordingRef.current || recorder.isRecording) void recorder.stop().catch(() => {});
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    void Speech.stop();
  }, [recorder]);

  const speak = async (text: string) => {
    if (voiceBusy) return;
    setVoiceBusy(true);
    try {
      await Speech.stop();
      const profile = getSpeechProfile(language);
      const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
      const voice = selectBestSpeechVoice(voices, language);
      const spokenText = prepareSpeechText(text, language);
      Speech.speak(spokenText.slice(0, Math.min(1200, Speech.maxSpeechInputLength)), {
        language: profile.locale,
        ...(voice ? { voice: voice.identifier } : {}),
        rate: profile.rate,
        pitch: profile.pitch,
        onDone: () => setVoiceBusy(false),
        onStopped: () => setVoiceBusy(false),
        onError: () => {
          setError(copy.voiceError);
          setVoiceBusy(false);
        },
      });
    } catch {
      setError(copy.voiceError);
      setVoiceBusy(false);
    }
  };

  const send = async (raw: string, speakReply = false) => {
    const message = raw.trim();
    if (!message || sending) return false;
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages((previous) => [...previous, { id: nextId.current++, role: 'user', content: message }]);
    setDraft('');
    setError('');
    setSending(true);
    try {
      const result = await api.post<ChatResponse>('/mobile/assistant/chat', { message, language, history });
      setMessages((previous) => [...previous, { id: nextId.current++, role: 'assistant', content: result.reply }]);
      if (speakReply) void speak(result.reply);
      return true;
    } catch (failure) {
      const status = (failure as { status?: number })?.status;
      setError(status === 404 || status === 503 ? copy.setup : copy.error);
      return false;
    } finally {
      setSending(false);
    }
  };

  async function transcribeVoiceRecording(uri: string): Promise<string> {
    const endpoint = `${API_BASE_URL}/mobile/assistant/transcribe`;
    const controller = new AbortController();
    uploadControllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 35_000);
    let status = 0;
    let responseBody = '';
    if (Platform.OS === 'web') {
      try {
        const form = new FormData();
        form.append('language', language);
        const blob = await (await fetch(uri)).blob();
        form.append('file', blob, 'voice.webm');
        const response = await fetch(endpoint, { method: 'POST', body: form, signal: controller.signal });
        status = response.status;
        responseBody = await response.text();
      } finally {
        clearTimeout(timeout);
        uploadControllerRef.current = null;
      }
    } else {
      try {
        const result = await new ExpoFile(uri).upload(endpoint, {
          httpMethod: 'POST',
          uploadType: UploadType.MULTIPART,
          fieldName: 'file',
          mimeType: 'audio/mp4',
          parameters: { language },
          sessionType: 'foreground',
          signal: controller.signal,
        });
        status = result.status;
        responseBody = result.body;
      } finally {
        clearTimeout(timeout);
        uploadControllerRef.current = null;
      }
    }
    if (status < 200 || status >= 300) {
      const failure = new Error('Voice transcription failed') as Error & { status?: number };
      failure.status = status;
      throw failure;
    }
    const transcript = (JSON.parse(responseBody) as { text?: string }).text?.trim();
    if (!transcript) throw new Error('Empty transcription');
    return transcript;
  }

  async function startVoiceListening() {
    if (!voiceModeActiveRef.current || voicePausedRef.current || voiceStartingRef.current || recordingRef.current || recorder.isRecording) return;
    voiceStartingRef.current = true;
    setError('');
    setVoiceBusy(false);
    speechDetectedRef.current = false;
    silenceStartedRef.current = null;
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('Microphone permission denied');
      await Speech.stop();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (!voiceModeActiveRef.current || voicePausedRef.current) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        return;
      }
      await recorder.prepareToRecordAsync();
      if (!voiceModeActiveRef.current || voicePausedRef.current) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        return;
      }
      recorder.record({ forDuration: 30 });
      recordingRef.current = true;
      setVoicePhase('listening');
      recordingTimeoutRef.current = setTimeout(() => { void finishVoiceTurn(); }, 30_000);
    } catch (failure) {
      console.warn('SRV Chat voice mode could not start recording.', (failure as Error)?.message ?? 'Unknown error');
      setVoicePhase('error');
      setError(copy.voiceError);
      void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } finally {
      voiceStartingRef.current = false;
    }
  }

  function speakVoiceReply(text: string) {
    const finishSpeech = () => {
      setVoiceBusy(false);
      if (!voiceModeActiveRef.current) return;
      if (voicePausedRef.current) {
        setVoicePhase('paused');
        return;
      }
      setTimeout(() => { void startVoiceListening(); }, 350);
    };

    void (async () => {
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        await Speech.stop();
        if (!voiceModeActiveRef.current) return;
        const profile = getSpeechProfile(language);
        const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
        const voice = selectBestSpeechVoice(voices, language);
        const spokenText = prepareSpeechText(text, language);
        setVoiceBusy(true);
        setVoicePhase('speaking');
        Speech.speak(spokenText.slice(0, Math.min(1200, Speech.maxSpeechInputLength)), {
          language: profile.locale,
          ...(voice ? { voice: voice.identifier } : {}),
          rate: profile.rate,
          pitch: profile.pitch,
          onDone: finishSpeech,
          onStopped: finishSpeech,
          onError: () => {
            setVoicePhase('error');
            setError(copy.voiceError);
            setVoiceBusy(false);
          },
        });
      } catch {
        setVoicePhase('error');
        setError(copy.voiceError);
        setVoiceBusy(false);
      }
    })();
  }

  async function processVoiceTurn(uri: string) {
    if (!voiceModeActiveRef.current) return;
    setVoiceBusy(true);
    setVoicePhase('processing');
    setSending(true);
    try {
      const transcript = await transcribeVoiceRecording(uri);
      if (!voiceModeActiveRef.current) return;
      setVoiceTranscript(transcript);
      const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
      setMessages((previous) => [...previous, { id: nextId.current++, role: 'user', content: transcript }]);
      const result = await api.post<ChatResponse>('/mobile/assistant/chat', { message: transcript, language, history, voiceMode: true });
      if (!voiceModeActiveRef.current) return;
      setMessages((previous) => [...previous, { id: nextId.current++, role: 'assistant', content: result.reply }]);
      setVoiceReply(result.reply);
      setSending(false);
      if (voicePausedRef.current) {
        setVoiceBusy(false);
        setVoicePhase('paused');
        return;
      }
      speakVoiceReply(result.reply);
    } catch (failure) {
      if (!voiceModeActiveRef.current) return;
      const status = (failure as { status?: number })?.status;
      console.warn('SRV Chat voice mode failed.', status ?? (failure as Error)?.message ?? 'Unknown error');
      setError(status === 404 || status === 503 ? copy.setup : copy.voiceError);
      setVoicePhase('error');
      setVoiceBusy(false);
    } finally {
      setSending(false);
    }
  }

  async function finishVoiceTurn() {
    if (voiceFinishingRef.current || (!recordingRef.current && !recorder.isRecording)) return;
    voiceFinishingRef.current = true;
    const heardSpeech = speechDetectedRef.current;
    recordingRef.current = false;
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!voiceModeActiveRef.current || voicePausedRef.current) return;
      if (!heardSpeech) {
        setTimeout(() => { void startVoiceListening(); }, 250);
        return;
      }
      if (!uri) throw new Error('No recording was saved');
      await processVoiceTurn(uri);
    } catch (failure) {
      if (!voiceModeActiveRef.current) return;
      console.warn('SRV Chat could not finish the voice turn.', (failure as Error)?.message ?? 'Unknown error');
      setError(copy.voiceError);
      setVoicePhase('error');
      setVoiceBusy(false);
    } finally {
      voiceFinishingRef.current = false;
    }
  }

  useEffect(() => {
    if (!voiceModeVisible || !recordingRef.current || !recorderState.isRecording || recorderState.metering === undefined) return;
    const now = Date.now();
    if (recorderState.metering > -43) {
      speechDetectedRef.current = true;
      silenceStartedRef.current = null;
    } else if (speechDetectedRef.current) {
      silenceStartedRef.current ??= now;
      if (now - silenceStartedRef.current >= 1400 && recorderState.durationMillis >= 900) {
        void finishVoiceTurn();
      }
    }
    // Recorder-state changes refresh this closure; adding the per-render turn
    // function itself would restart the metering effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceModeVisible, recorderState.durationMillis, recorderState.isRecording, recorderState.metering]);

  const openVoiceMode = async () => {
    closedRef.current = false;
    voiceModeActiveRef.current = true;
    voicePausedRef.current = false;
    setVoicePaused(false);
    setVoiceTranscript('');
    setVoiceReply('');
    setError('');
    setVoicePhase('idle');
    setVoiceModeVisible(true);
    await startVoiceListening();
  };

  const closeVoiceMode = () => {
    voiceModeActiveRef.current = false;
    voicePausedRef.current = false;
    voiceStartingRef.current = false;
    voiceFinishingRef.current = false;
    uploadControllerRef.current?.abort();
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
    if (recordingRef.current || recorder.isRecording) {
      recordingRef.current = false;
      void recorder.stop().catch(() => {});
    }
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    void Speech.stop();
    setVoiceBusy(false);
    setVoicePaused(false);
    setVoicePhase('idle');
    setVoiceModeVisible(false);
  };

  const toggleVoicePause = async () => {
    if (voicePausedRef.current) {
      voicePausedRef.current = false;
      setVoicePaused(false);
      await startVoiceListening();
      return;
    }
    voicePausedRef.current = true;
    setVoicePaused(true);
    setVoicePhase('paused');
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
    if (recordingRef.current || recorder.isRecording) {
      recordingRef.current = false;
      await recorder.stop().catch(() => {});
    }
    await Speech.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setVoiceBusy(false);
  };

  const handleVoiceOrbPress = async () => {
    if (voicePhase === 'processing') return;
    if (voicePhase === 'listening') {
      speechDetectedRef.current = true;
      await finishVoiceTurn();
      return;
    }
    if (voicePhase === 'speaking') {
      await Speech.stop();
      return;
    }
    voicePausedRef.current = false;
    setVoicePaused(false);
    await startVoiceListening();
  };

  const close = () => {
    closedRef.current = true;
    voiceModeActiveRef.current = false;
    voicePausedRef.current = false;
    uploadControllerRef.current?.abort();
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
    if (recordingRef.current || recorder.isRecording) {
      recordingRef.current = false;
      void recorder.stop().catch(() => {});
      void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    }
    void Speech.stop();
    setVoiceBusy(false);
    setVoiceModeVisible(false);
    setVoicePaused(false);
    setVoicePhase('idle');
    onClose();
  };

  const voiceStatusText = voicePhase === 'listening'
    ? copy.listening
    : voicePhase === 'processing'
      ? copy.processing
      : voicePhase === 'speaking'
        ? copy.voiceSpeaking
        : voicePhase === 'paused'
          ? copy.voicePaused
          : voicePhase === 'error'
            ? copy.voiceError
            : copy.voiceHint;
  const meterStrength = voicePhase === 'listening'
    ? Math.max(0.15, Math.min(1, ((recorderState.metering ?? -60) + 60) / 35))
    : voicePhase === 'speaking' ? 0.75 : 0.25;
  const compactVoiceLayout = screenHeight < 720 || screenWidth < 375;
  const compactChatLayout = screenHeight < 700 || screenWidth < 375;
  const voiceOuterSize = Math.max(150, Math.min(compactVoiceLayout ? 176 : 214, screenWidth - 88));
  const voiceTouchSize = voiceOuterSize + 10;
  const voiceInnerSize = Math.round(voiceOuterSize * 0.82);
  const voiceCoreSize = Math.round(voiceOuterSize * 0.66);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={close}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
        {voiceModeVisible ? (
          <LinearGradient colors={['#071B42', '#162D72', '#5143A3']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.voiceModeScreen, compactVoiceLayout && styles.voiceModeScreenCompact]}>
            <View style={[styles.voiceModeHeader, compactVoiceLayout && styles.voiceModeHeaderCompact]}>
              <Pressable onPress={closeVoiceMode} accessibilityRole="button" accessibilityLabel={copy.end} style={styles.voiceModeClose}>
                <Text style={styles.voiceModeCloseText}>×</Text>
              </Pressable>
              <View style={styles.voiceModeHeading}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.voiceModeTitle}>{copy.voiceTitle}</Text>
                <Text style={styles.voiceModeLanguage}>{language === 'English' ? 'English' : language === 'Hindi' ? 'हिन्दी' : 'ਪੰਜਾਬੀ'}</Text>
              </View>
              <View style={styles.voiceLiveBadge}><View style={styles.voiceLiveDot} /><Text style={styles.voiceLiveText}>LIVE</Text></View>
            </View>

            <ScrollView style={styles.voiceModeScroller} contentContainerStyle={[styles.voiceModeBody, compactVoiceLayout && styles.voiceModeBodyCompact]} showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={styles.voiceBrand}>SRV</Text>
              <Text style={[styles.voiceAssistantName, compactVoiceLayout && styles.voiceAssistantNameCompact]}>Chat Voice</Text>
              <Pressable testID="srv-chat-voice-orb" onPress={() => void handleVoiceOrbPress()} disabled={voicePhase === 'processing'} accessibilityRole="button" accessibilityLabel={voiceStatusText} style={[styles.voiceOrbTouch, { width: voiceTouchSize, height: voiceTouchSize, borderRadius: voiceTouchSize / 2 }]}>
                <View style={[styles.voiceOrbRingOuter, { width: voiceOuterSize, height: voiceOuterSize, borderRadius: voiceOuterSize / 2 }, voicePhase === 'listening' && styles.voiceOrbListening]}>
                  <View style={[styles.voiceOrbRingInner, { width: voiceInnerSize, height: voiceInnerSize, borderRadius: voiceInnerSize / 2 }]}>
                    <LinearGradient colors={voicePhase === 'error' ? ['#D9435F', '#9F3157'] : ['#50D5E7', '#5965E8', '#9C58D9']} style={[styles.voiceOrb, { width: voiceCoreSize, height: voiceCoreSize, borderRadius: voiceCoreSize / 2 }]}>
                      {voicePhase === 'processing' ? <ActivityIndicator color="#FFFFFF" size="large" /> : <MicIcon color="#FFFFFF" size={compactVoiceLayout ? 40 : 48} />}
                    </LinearGradient>
                  </View>
                </View>
              </Pressable>

              <View style={styles.voiceWaveform} accessibilityElementsHidden>
                {[0.45, 0.75, 1, 0.7, 0.5].map((factor, index) => (
                  <View key={index} style={[styles.voiceWaveBar, { height: 8 + 34 * meterStrength * factor }]} />
                ))}
              </View>
              <Text maxFontSizeMultiplier={1.25} style={styles.voiceModeStatus}>{voiceStatusText}</Text>
              <Text style={styles.voiceModeHint}>{voicePhase === 'speaking' ? copy.interrupt : copy.voiceHint}</Text>

              {voiceTranscript || voiceReply ? (
                <View style={styles.voiceTranscriptCard}>
                  {voiceTranscript ? <Text numberOfLines={2} style={styles.voiceTranscriptUser}>“{voiceTranscript}”</Text> : null}
                  {voiceReply ? <Text numberOfLines={3} style={styles.voiceTranscriptAssistant}>{voiceReply}</Text> : null}
                </View>
              ) : null}
              {error ? <Text style={styles.voiceModeError}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.voiceModeControls}>
              <Pressable testID="srv-chat-voice-pause" onPress={() => void toggleVoicePause()} accessibilityRole="button" accessibilityLabel={voicePaused ? copy.resume : copy.mute} style={styles.voiceControlButton}>
                {voicePaused ? <Text style={styles.voiceResumeIcon}>▶</Text> : <MicIcon color="#FFFFFF" size={24} />}
                <Text style={styles.voiceControlLabel}>{voicePaused ? copy.resume : copy.mute}</Text>
              </Pressable>
              <Pressable testID="srv-chat-voice-end" onPress={closeVoiceMode} accessibilityRole="button" accessibilityLabel={copy.end} style={[styles.voiceControlButton, styles.voiceEndButton]}>
                <Text style={styles.voiceEndIcon}>×</Text>
                <Text style={styles.voiceControlLabel}>{copy.end}</Text>
              </Pressable>
            </View>
            <Text style={styles.voicePrivacy}>{copy.privacy}</Text>
          </LinearGradient>
        ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          <LinearGradient colors={['#0C2C65', '#233E91', '#5751AF']} style={[styles.header, compactChatLayout && styles.headerCompact]}>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close SRV Chat" style={styles.close}><Text style={styles.closeText}>‹</Text></Pressable>
            <View style={styles.headerIcon}><ChatIcon size={27} /></View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>SRV Chat</Text>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.subtitle}>{copy.hint}</Text>
            </View>
            <View style={styles.onlineDot} />
          </LinearGradient>

          <View style={[styles.languages, compactChatLayout && styles.languagesCompact]}>
            {(['English', 'Hindi', 'Punjabi'] as AppLanguage[]).map((item) => (
              <Pressable key={item} onPress={() => setLanguage(item)} style={[styles.languageChoice, language === item && styles.languageActive]}>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={[styles.languageText, language === item && styles.languageTextActive]}>{item === 'English' ? 'English' : item === 'Hindi' ? 'हिन्दी' : 'ਪੰਜਾਬੀ'}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.conversation}
            contentContainerStyle={[styles.conversationContent, compactChatLayout && styles.conversationContentCompact]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentInsetAdjustmentBehavior="never"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <View style={styles.assistantBubble}><Text style={styles.assistantText}>{copy.welcome}</Text></View>
            {messages.map((item) => (
              <View key={item.id} style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>{item.content}</Text>
                {item.role === 'assistant' ? (
                  <Pressable onPress={() => void speak(item.content)} disabled={voiceBusy} accessibilityRole="button" accessibilityLabel="Play AI spoken reply" style={styles.speakButton}>
                    <Text style={styles.speakText}>🔊</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            {sending ? <View style={styles.thinking}><ActivityIndicator color="#4F4CCC" size="small" /><Text style={styles.thinkingText}>{copy.thinking}</Text></View> : null}
            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
            {messages.length === 0 ? (
              <View style={styles.suggestions}>
                {[copy.qr, copy.products, copy.hello].map((suggestion) => (
                  <Pressable key={suggestion} onPress={() => void send(suggestion)} style={styles.suggestion}>
                    <Text style={styles.suggestionText}>{suggestion}  ↗</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Pressable onPress={() => void openWhatsAppSupport(supportWhatsApp, 'Hello SRV Electricals, I need help with my QR scan or product.')} style={styles.supportLink}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={styles.supportText}>{copy.support}  ·  {String(supportWhatsApp ?? '8837684004').replace(/^91/, '')}  ↗</Text>
          </Pressable>
          <View style={[styles.composer, compactChatLayout && styles.composerCompact]}>
            <TextInput
              testID="srv-chat-input" value={draft} onChangeText={setDraft} placeholder={copy.placeholder}
              placeholderTextColor="#909CB4" multiline maxLength={1200} style={styles.input}
              scrollEnabled blurOnSubmit={false}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180)}
              editable={!sending && !voiceBusy} accessibilityLabel={copy.placeholder}
            />
            {draft.trim() ? (
              <Pressable testID="srv-chat-send" onPress={() => void send(draft)} disabled={sending} style={[styles.sendButton, sending && styles.sendDisabled]}>
                <VoiceSendIcon />
              </Pressable>
            ) : (
              <Pressable testID="srv-chat-mic" onPress={() => void openVoiceMode()} disabled={voiceBusy || sending} accessibilityRole="button" accessibilityLabel={copy.record} style={styles.micButton}>
                <MicIcon />
              </Pressable>
            )}
          </View>
          <Text style={styles.disclosure}>{copy.disclosure}</Text>
        </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  launcher: { position: 'absolute', right: 14, zIndex: 80, elevation: 20, borderRadius: 23, shadowColor: '#283D9B', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 10 },
  launcherFill: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  screen: { flex: 1, backgroundColor: '#F3F6FC' },
  voiceModeScreen: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  voiceModeScreenCompact: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  voiceModeHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceModeHeaderCompact: { minHeight: 52, gap: 8 },
  voiceModeClose: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.11)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  voiceModeCloseText: { color: '#FFFFFF', fontSize: 29, lineHeight: 31, fontWeight: '300' },
  voiceModeHeading: { flex: 1 },
  voiceModeTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  voiceModeLanguage: { color: '#BFD2FF', fontSize: 11, fontWeight: '700', marginTop: 2 },
  voiceLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.11)' },
  voiceLiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#5EF0BC' },
  voiceLiveText: { color: '#DFFBF2', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  voiceModeScroller: { flex: 1 },
  voiceModeBody: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 8 },
  voiceModeBodyCompact: { justifyContent: 'flex-start', paddingTop: 4 },
  voiceBrand: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 4, opacity: 0.82 },
  voiceAssistantName: { color: '#D7E4FF', fontSize: 12, fontWeight: '700', marginTop: 2, marginBottom: 23 },
  voiceAssistantNameCompact: { marginBottom: 8 },
  voiceOrbTouch: { width: 224, height: 224, borderRadius: 112, alignItems: 'center', justifyContent: 'center' },
  voiceOrbRingOuter: { width: 214, height: 214, borderRadius: 107, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(115,142,255,0.10)', borderWidth: 1, borderColor: 'rgba(167,192,255,0.18)' },
  voiceOrbListening: { backgroundColor: 'rgba(78,221,225,0.14)', borderColor: 'rgba(105,237,226,0.36)' },
  voiceOrbRingInner: { width: 176, height: 176, borderRadius: 88, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  voiceOrb: { width: 142, height: 142, borderRadius: 71, alignItems: 'center', justifyContent: 'center', shadowColor: '#67DFF1', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 16 },
  voiceWaveform: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 14 },
  voiceWaveBar: { width: 5, minHeight: 8, borderRadius: 3, backgroundColor: '#8EE9F0' },
  voiceModeStatus: { color: '#FFFFFF', fontSize: 18, lineHeight: 25, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  voiceModeHint: { color: '#BBCBEF', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, maxWidth: 290 },
  voiceTranscriptCard: { width: '100%', maxWidth: 360, marginTop: 18, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 18, backgroundColor: 'rgba(4,16,45,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', gap: 7 },
  voiceTranscriptUser: { color: '#B6F1F3', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  voiceTranscriptAssistant: { color: '#F2F5FF', fontSize: 13, lineHeight: 19 },
  voiceModeError: { color: '#FFD3DC', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 },
  voiceModeControls: { flexDirection: 'row', justifyContent: 'center', gap: 34, paddingTop: 8, paddingBottom: 12 },
  voiceControlButton: { minWidth: 72, alignItems: 'center', gap: 6 },
  voiceEndButton: {},
  voiceControlLabel: { color: '#DFE8FF', fontSize: 11, fontWeight: '700' },
  voiceResumeIcon: { width: 50, height: 50, borderRadius: 25, color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.14)', textAlign: 'center', textAlignVertical: 'center', fontSize: 18, overflow: 'hidden' },
  voiceEndIcon: { width: 50, height: 50, borderRadius: 25, color: '#FFFFFF', backgroundColor: '#D9475A', textAlign: 'center', textAlignVertical: 'center', fontSize: 30, lineHeight: 46, overflow: 'hidden' },
  voicePrivacy: { color: '#92A7D2', fontSize: 9, textAlign: 'center', paddingBottom: 2 },
  voiceStatus: { color: '#33458A', textAlign: 'center', fontSize: 12, fontWeight: '700', paddingBottom: 4 },
  voiceReadyComposer: { alignItems: 'center' },
  voiceDiscardButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F3F8' },
  voiceDiscardText: { color: '#78849B', fontSize: 23, lineHeight: 25, fontWeight: '500' },
  voiceReadyContent: { flex: 1, minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 4 },
  voiceReadyText: { color: '#3C4B6B', fontSize: 13, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 86, paddingHorizontal: 16, gap: 10 },
  headerCompact: { minHeight: 68, paddingHorizontal: 12, gap: 8 },
  close: { width: 32, height: 40, justifyContent: 'center' },
  closeText: { color: '#FFFFFF', fontSize: 35, lineHeight: 40 },
  headerIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#DBE7FF', fontSize: 11, marginTop: 2 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#6EE7B7' },
  languages: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8ECF5' },
  languagesCompact: { gap: 6, paddingHorizontal: 9, paddingVertical: 7 },
  languageChoice: { flex: 1, maxWidth: 120, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F3F8' },
  languageActive: { backgroundColor: '#E5E6FF' },
  languageText: { color: '#66718B', fontSize: 12, fontWeight: '700' },
  languageTextActive: { color: '#333AA5' },
  conversation: { flex: 1 },
  conversationContent: { padding: 16, paddingBottom: 25, gap: 12 },
  conversationContentCompact: { padding: 12, paddingBottom: 16, gap: 9 },
  bubble: { maxWidth: '87%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  assistantBubble: { alignSelf: 'flex-start', maxWidth: '87%', backgroundColor: '#FFFFFF', borderRadius: 18, borderTopLeftRadius: 5, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E8ECF5' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#3E4CBD', borderTopRightRadius: 5 },
  assistantText: { color: '#26324E', fontSize: 14, lineHeight: 21 },
  userText: { color: '#FFFFFF', fontSize: 14, lineHeight: 21 },
  thinking: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  thinkingText: { color: '#596A8E', fontSize: 12 },
  errorBox: { backgroundColor: '#FFF0F0', padding: 12, borderRadius: 12 },
  errorText: { color: '#B43445', fontSize: 12 },
  suggestions: { gap: 8, marginTop: 4 },
  suggestion: { alignSelf: 'flex-start', backgroundColor: '#E8EDFF', borderWidth: 1, borderColor: '#D8E0FF', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  suggestionText: { color: '#35479F', fontSize: 12, fontWeight: '700' },
  supportLink: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  supportText: { color: '#3451A4', fontSize: 12, fontWeight: '800' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginHorizontal: 12, marginTop: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 24, borderWidth: 1, borderColor: '#DEE4F2', backgroundColor: '#FFFFFF' },
  composerCompact: { gap: 7, marginHorizontal: 8, paddingHorizontal: 10, paddingVertical: 6 },
  input: { flex: 1, minWidth: 0, minHeight: 34, maxHeight: 100, color: '#203052', fontSize: 14, lineHeight: 20, paddingVertical: 6 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3E4CBD', alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#FFFFFF', fontSize: 17 },
  micButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E9ECF9', alignItems: 'center', justifyContent: 'center' },
  micRecording: { backgroundColor: '#FFE0E4' },
  stopIcon: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#D83A4E' },
  speakButton: { alignSelf: 'flex-end', marginTop: 6, paddingHorizontal: 3 },
  speakText: { fontSize: 15 },
  disclosure: { color: '#8C97AB', fontSize: 10, textAlign: 'center', paddingVertical: 7 },
});
