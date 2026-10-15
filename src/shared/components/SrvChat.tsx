import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/shared/preferences/LocalizedNative';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Speech from 'expo-speech';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { api } from '@/shared/api';
import { API_BASE_URLS } from '@/shared/api/config';
import { usePreferenceContext, type AppLanguage } from '@/shared/preferences';
import { openWhatsAppSupport } from '@/shared/utils/whatsapp';

type Message = { id: number; role: 'user' | 'assistant'; content: string };
type ChatResponse = { reply: string; supportWhatsApp: string };

const COPY: Record<AppLanguage, {
  welcome: string; hint: string; placeholder: string; support: string; qr: string; products: string; hello: string;
  error: string; setup: string; thinking: string; disclosure: string; record: string; stop: string; voiceError: string;
}> = {
  English: {
    welcome: 'Hi! I’m SRV Chat. Ask me about SRV products, QR scans, rewards, or just say hello.',
    hint: 'Your SRV helper, here anytime', placeholder: 'Ask SRV Chat anything…', support: 'WhatsApp support',
    qr: 'My QR is not scanning', products: 'Tell me about SRV products', hello: 'Hey, how are you?',
    error: 'I could not reply right now. Please try again or contact SRV support.',
    setup: 'AI replies are being set up on the server. SRV support can help you now.',
    thinking: 'SRV Chat is thinking…', disclosure: 'Replies use AI; spoken replies use your phone voice. Do not share OTPs or passwords.',
    record: 'Record voice message', stop: 'Stop recording', voiceError: 'Could not process the voice message. Please try again.',
  },
  Hindi: {
    welcome: 'नमस्ते! मैं SRV Chat हूँ। प्रोडक्ट, QR स्कैन, रिवॉर्ड्स या किसी भी सवाल के बारे में पूछें।',
    hint: 'आपका SRV सहायक', placeholder: 'SRV Chat से कुछ भी पूछें…', support: 'WhatsApp सहायता',
    qr: 'मेरा QR स्कैन नहीं हो रहा', products: 'SRV प्रोडक्ट बताइए', hello: 'नमस्ते, कैसे हो?',
    error: 'अभी जवाब नहीं दे पा रहा हूँ। फिर कोशिश करें या SRV सहायता से संपर्क करें।',
    setup: 'सर्वर पर AI सेवा सेट हो रही है। अभी SRV सहायता से संपर्क करें।',
    thinking: 'SRV Chat सोच रहा है…', disclosure: 'जवाब AI देता है; आवाज़ आपके फ़ोन से आती है। OTP या पासवर्ड साझा न करें।',
    record: 'आवाज़ रिकॉर्ड करें', stop: 'रिकॉर्डिंग रोकें', voiceError: 'आवाज़ समझ नहीं आई। फिर कोशिश करें।',
  },
  Punjabi: {
    welcome: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ SRV Chat ਹਾਂ। ਪ੍ਰੋਡਕਟ, QR ਸਕੈਨ, ਰਿਵਾਰਡ ਜਾਂ ਹੋਰ ਕੋਈ ਸਵਾਲ ਪੁੱਛੋ।',
    hint: 'ਤੁਹਾਡਾ SRV ਸਹਾਇਕ', placeholder: 'SRV Chat ਨੂੰ ਕੁਝ ਵੀ ਪੁੱਛੋ…', support: 'WhatsApp ਮਦਦ',
    qr: 'ਮੇਰਾ QR ਸਕੈਨ ਨਹੀਂ ਹੋ ਰਿਹਾ', products: 'SRV ਪ੍ਰੋਡਕਟ ਦੱਸੋ', hello: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਕੀ ਹਾਲ ਹੈ?',
    error: 'ਹੁਣੇ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਦਾ। ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ SRV ਮਦਦ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
    setup: 'ਸਰਵਰ ਤੇ AI ਸੇਵਾ ਸੈੱਟ ਹੋ ਰਹੀ ਹੈ। ਹੁਣੇ SRV ਮਦਦ ਨਾਲ ਗੱਲ ਕਰੋ।',
    thinking: 'SRV Chat ਸੋਚ ਰਿਹਾ ਹੈ…', disclosure: 'ਜਵਾਬ AI ਦਿੰਦਾ ਹੈ; ਆਵਾਜ਼ ਤੁਹਾਡੇ ਫ਼ੋਨ ਤੋਂ ਆਉਂਦੀ ਹੈ। OTP ਜਾਂ ਪਾਸਵਰਡ ਨਾ ਦਿਓ।',
    record: 'ਆਵਾਜ਼ ਰਿਕਾਰਡ ਕਰੋ', stop: 'ਰਿਕਾਰਡਿੰਗ ਰੋਕੋ', voiceError: 'ਆਵਾਜ਼ ਸਮਝ ਨਹੀਂ ਆਈ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
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

export function SrvChatLauncher({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      testID="srv-chat-launcher"
      accessibilityRole="button"
      accessibilityLabel="Open SRV Chat"
      onPress={onPress}
      style={[styles.launcher, { bottom: Math.max(82, insets.bottom + 72) }]}
    >
      <LinearGradient colors={['#123B87', '#4F4CCC', '#8860D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.launcherFill}>
        <ChatIcon />
        <Text style={styles.launcherText}>SRV Chat</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SrvChatModal({ visible, onClose, supportWhatsApp }: {
  visible: boolean; onClose: () => void; supportWhatsApp?: string | null;
}) {
  const { language: appLanguage } = usePreferenceContext();
  const [language, setLanguage] = useState<AppLanguage>(appLanguage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const nextId = useRef(1);
  const copy = COPY[language];

  useEffect(() => () => {
    void Speech.stop();
  }, []);

  const speak = async (text: string) => {
    if (voiceBusy) return;
    setVoiceBusy(true);
    try {
      await Speech.stop();
      const locale = language === 'Punjabi' ? 'pa-IN' : language === 'Hindi' ? 'hi-IN' : 'en-IN';
      const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
      const voice = voices.find((item) => item.language.toLowerCase() === locale.toLowerCase());
      Speech.speak(text.slice(0, Math.min(1200, Speech.maxSpeechInputLength)), {
        language: locale,
        ...(voice ? { voice: voice.identifier } : {}),
        rate: 0.95,
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
    if (!message || sending) return;
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages((previous) => [...previous, { id: nextId.current++, role: 'user', content: message }]);
    setDraft('');
    setError('');
    setSending(true);
    try {
      const result = await api.post<ChatResponse>('/mobile/assistant/chat', { message, language, history });
      setMessages((previous) => [...previous, { id: nextId.current++, role: 'assistant', content: result.reply }]);
      if (speakReply) void speak(result.reply);
    } catch (failure) {
      setError((failure as { status?: number })?.status === 503 ? copy.setup : copy.error);
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = async () => {
    if (voiceBusy || sending) return;
    setError('');
    if (recording) {
      setRecording(false);
      setVoiceBusy(true);
      let sentToChat = false;
      try {
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const uri = recorder.uri;
        if (!uri) throw new Error('No recording');
        const form = new FormData();
        if (Platform.OS === 'web') {
          const blob = await (await fetch(uri)).blob();
          form.append('file', blob, 'voice.webm');
        } else {
          form.append('file', { uri, name: 'voice.m4a', type: 'audio/mp4' } as unknown as Blob);
        }
        let transcript = '';
        for (const baseUrl of API_BASE_URLS) {
          try {
            const response = await fetch(`${baseUrl}/mobile/assistant/transcribe`, { method: 'POST', body: form });
            if (!response.ok) throw new Error(`Voice transcription failed: ${response.status}`);
            transcript = (await response.json() as { text: string }).text;
            break;
          } catch (failure) {
            if (baseUrl === API_BASE_URLS[API_BASE_URLS.length - 1]) throw failure;
          }
        }
        setVoiceBusy(false);
        await send(transcript, true);
        sentToChat = true;
      } catch {
        setError(copy.voiceError);
      } finally {
        if (!sentToChat) setVoiceBusy(false);
      }
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('Microphone permission denied');
      await Speech.stop();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch {
      setError(copy.voiceError);
    }
  };

  const close = () => {
    if (recording) {
      void recorder.stop();
      void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setRecording(false);
    }
    void Speech.stop();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} statusBarTranslucent={false}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <LinearGradient colors={['#0C2C65', '#233E91', '#5751AF']} style={styles.header}>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close SRV Chat" style={styles.close}><Text style={styles.closeText}>‹</Text></Pressable>
            <View style={styles.headerIcon}><ChatIcon size={27} /></View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>SRV Chat</Text>
              <Text style={styles.subtitle}>{copy.hint}</Text>
            </View>
            <View style={styles.onlineDot} />
          </LinearGradient>

          <View style={styles.languages}>
            {(['English', 'Hindi', 'Punjabi'] as AppLanguage[]).map((item) => (
              <Pressable key={item} onPress={() => setLanguage(item)} style={[styles.languageChoice, language === item && styles.languageActive]}>
                <Text style={[styles.languageText, language === item && styles.languageTextActive]}>{item === 'English' ? 'English' : item === 'Hindi' ? 'हिन्दी' : 'ਪੰਜਾਬੀ'}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView ref={scrollRef} style={styles.conversation} contentContainerStyle={styles.conversationContent}
            keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
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
            <Text style={styles.supportText}>{copy.support}  ·  {String(supportWhatsApp ?? '8837684004').replace(/^91/, '')}  ↗</Text>
          </Pressable>
          <View style={styles.composer}>
            <Pressable onPress={() => void toggleRecording()} disabled={voiceBusy || sending} accessibilityRole="button" accessibilityLabel={recording ? copy.stop : copy.record} style={[styles.micButton, recording && styles.micRecording]}>
              <Text style={styles.micText}>{voiceBusy ? '…' : recording ? '■' : '🎙'}</Text>
            </Pressable>
            <TextInput
              testID="srv-chat-input" value={draft} onChangeText={setDraft} placeholder={copy.placeholder}
              placeholderTextColor="#909CB4" multiline maxLength={1200} style={styles.input}
              editable={!sending && !recording && !voiceBusy} accessibilityLabel={copy.placeholder}
            />
            <Pressable testID="srv-chat-send" onPress={() => void send(draft)} disabled={!draft.trim() || sending} style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}>
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>
          <Text style={styles.disclosure}>{copy.disclosure}</Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  launcher: { position: 'absolute', right: 12, zIndex: 80, elevation: 20, borderRadius: 28, shadowColor: '#283D9B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
  launcherFill: { height: 50, paddingHorizontal: 14, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  launcherText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  screen: { flex: 1, backgroundColor: '#F3F6FC' },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 86, paddingHorizontal: 16, gap: 10 },
  close: { width: 32, height: 40, justifyContent: 'center' },
  closeText: { color: '#FFFFFF', fontSize: 35, lineHeight: 40 },
  headerIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#DBE7FF', fontSize: 11, marginTop: 2 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#6EE7B7' },
  languages: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 11, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8ECF5' },
  languageChoice: { paddingHorizontal: 15, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F3F8' },
  languageActive: { backgroundColor: '#E5E6FF' },
  languageText: { color: '#66718B', fontSize: 12, fontWeight: '700' },
  languageTextActive: { color: '#333AA5' },
  conversation: { flex: 1 },
  conversationContent: { padding: 16, paddingBottom: 25, gap: 12 },
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
  input: { flex: 1, minHeight: 34, maxHeight: 100, color: '#203052', fontSize: 14, paddingVertical: 6 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3E4CBD', alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#FFFFFF', fontSize: 17 },
  micButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E9ECF9', alignItems: 'center', justifyContent: 'center' },
  micRecording: { backgroundColor: '#FFE0E4' },
  micText: { color: '#B9344B', fontSize: 17 },
  speakButton: { alignSelf: 'flex-end', marginTop: 6, paddingHorizontal: 3 },
  speakText: { fontSize: 15 },
  disclosure: { color: '#8C97AB', fontSize: 10, textAlign: 'center', paddingVertical: 7 },
});
