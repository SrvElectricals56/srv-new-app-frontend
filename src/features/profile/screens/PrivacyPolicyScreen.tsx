import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { useAppData } from '@/shared/context/AppDataContext';

type ParsedSection = { title: string; content: string };

function parsePrivacySections(text: string): ParsedSection[] {
  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];
  const sectionHeaderRe = /^\d+\.\s+\S/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (sectionHeaderRe.test(trimmed)) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
      }
      currentTitle = trimmed;
      currentContent = [];
    } else {
      currentContent.push(trimmed);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
  }
  return sections;
}

export function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  const { tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const { appSettings } = useAppData();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'privacy_policy');

  const dbContent = appSettings?.privacyPolicyContent;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || tx('Privacy Policy')} onBack={onBack} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dbContent ? (
          <>
            {appSettings?.privacyPolicyUpdated && (
              <View
                style={[
                  styles.policyDateCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.policyDateInner}>
                  <View style={[styles.policyDateIcon, { backgroundColor: theme.accentSoft }]}>
                    <AppIcon name="history" size={16} color={theme.accent} />
                  </View>
                  <View>
                    <Text style={[styles.policyDateLabel, { color: theme.textMuted }]}>
                      {tx('Last updated')}
                    </Text>
                    <Text style={[styles.policyDateText, { color: theme.textPrimary }]}>
                      {appSettings.privacyPolicyUpdated}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            {parsePrivacySections(dbContent).map((section, index) => (
              <View
                key={index}
                style={[
                  styles.policySection,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                ]}
              >
                <View style={styles.policySectionGlow} />
                <View style={styles.policySectionHeader}>
                  <View style={[styles.policySectionNumberWrap, { borderColor: theme.border }]}>
                    <View style={[styles.policySectionNumber, { backgroundColor: theme.accentSoft }]}>
                      <Text style={styles.policySectionNumberText}>{index + 1}</Text>
                    </View>
                  </View>
                  <View style={styles.policySectionTitleWrap}>
                    <Text style={[styles.policySectionTitle, { color: theme.textPrimary }]}>
                      {section.title}
                    </Text>
                    <Text style={[styles.policySectionMini, { color: theme.textMuted }]}>
                      SRV privacy policy
                    </Text>
                  </View>
                </View>
                <View style={[styles.policyDivider, { backgroundColor: theme.border }]} />
                <Text style={[styles.policySectionContent, { color: theme.textSecondary }]}>
                  {section.content}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <FallbackContent pageContent={pageContent} />
        )}
      </ScrollView>
    </View>
  );
}

function FallbackContent({ pageContent }: { pageContent: Record<string, string> }) {
  const { tx, theme, language } = usePreferenceContext();

  const privacyCopy =
    language === 'Hindi'
      ? {
          heroTitle: 'SRV के साथ आपका डेटा सुरक्षित रहता है',
          heroText:
            'हमने यह पॉलिसी आसान रखी है ताकि डीलर और इलेक्ट्रीशियन जल्दी समझ सकें कि हम कौन-सा डेटा लेते हैं, क्यों लेते हैं और आपका कंट्रोल कैसे बना रहता है।',
          chipOne: 'डेटा का स्पष्ट उपयोग',
          chipTwo: 'पॉलिसी अपडेट साझा किए जाते हैं',
          updatedLabel: 'आखिरी अपडेट',
          sectionMini: 'SRV गोपनीयता दिशानिर्देश',
          sections: [
            { title: '1. जानकारी का संग्रह', content: 'अकाउंट रजिस्ट्रेशन के समय हम आपका नाम, फोन नंबर, ईमेल और बिजनेस जानकारी जैसी व्यक्तिगत जानकारी लेते हैं। साथ ही स्कैन हिस्ट्री, रिवॉर्ड पॉइंट्स और ऐप उपयोग जैसी जानकारी भी संग्रहित की जाती है।' },
            { title: '2. जानकारी का उपयोग', content: 'आपकी जानकारी का उपयोग सेवाएं देने और बेहतर बनाने, रिवॉर्ड पॉइंट ट्रांजैक्शन प्रोसेस करने, अकाउंट संबंधित संपर्क करने और आपकी सहमति से प्रमोशनल नोटिफिकेशन भेजने के लिए किया जाता है।' },
            { title: '3. डेटा सुरक्षा', content: 'आपकी जानकारी को अनधिकृत एक्सेस, बदलाव, खुलासे या नष्ट होने से बचाने के लिए हम उचित सुरक्षा उपाय लागू करते हैं।' },
            { title: '4. जानकारी साझा करना', content: 'हम आपकी व्यक्तिगत जानकारी बेचते नहीं हैं। जरूरत के अनुसार हम कनेक्टेड डीलर्स (इलेक्ट्रीशियन अकाउंट के लिए) और ऐप संचालन में मदद करने वाले सेवा प्रदाताओं के साथ गोपनीयता समझौते के तहत जानकारी साझा कर सकते हैं।' },
            { title: '5. उपयोगकर्ता अधिकार', content: 'आपको ऐप सेटिंग्स या सपोर्ट टीम से संपर्क करके अपनी जानकारी देखने, अपडेट करने या हटाने का अधिकार है।' },
            { title: '6. कुकीज़ और ट्रैकिंग', content: 'ऐप की कार्यक्षमता बनाए रखने और उपयोग पैटर्न समझने के लिए हम कुकीज़ और समान ट्रैकिंग तकनीकें उपयोग करते हैं। आप डिवाइस सेटिंग्स में कुकी प्राथमिकताएं बदल सकते हैं।' },
            { title: '7. थर्ड-पार्टी लिंक', content: 'हमारे ऐप में थर्ड-पार्टी वेबसाइट के लिंक हो सकते हैं। उन बाहरी साइटों की प्राइवेसी प्रैक्टिस के लिए हम जिम्मेदार नहीं हैं।' },
            { title: '8. बच्चों की गोपनीयता', content: 'हमारी सेवाएं 18 वर्ष से कम उम्र के उपयोगकर्ताओं के लिए नहीं हैं। हम नाबालिगों से जानबूझकर जानकारी एकत्र नहीं करते।' },
            { title: '9. पॉलिसी में बदलाव', content: 'हम समय-समय पर इस प्राइवेसी पॉलिसी को अपडेट कर सकते हैं। बड़े बदलाव होने पर हम ऐप नोटिफिकेशन या ईमेल के जरिए जानकारी देंगे।' },
            { title: '10. संपर्क करें', content: 'गोपनीयता से जुड़ी किसी भी जानकारी के लिए संपर्क करें:\nEmail: info@srvelectricals.com\nPhone: +91 8837684004' },
          ],
        }
      : language === 'Punjabi'
        ? {
            heroTitle: 'SRV ਨਾਲ ਤੁਹਾਡਾ ਡਾਟਾ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦਾ ਹੈ',
            heroText:
              'ਅਸੀਂ ਇਹ ਨੀਤੀ ਆਸਾਨ ਰੱਖੀ ਹੈ ਤਾਂ ਜੋ ਡੀਲਰ ਅਤੇ ਇਲੈਕਟ੍ਰੀਸ਼ਨ ਤੁਰੰਤ ਸਮਝ ਸਕਣ ਕਿ ਅਸੀਂ ਕਿਹੜਾ ਡਾਟਾ ਲੈਂਦੇ ਹਾਂ, ਕਿਉਂ ਲੈਂਦੇ ਹਾਂ ਅਤੇ ਤੁਹਾਡਾ ਕੰਟਰੋਲ ਕਿਵੇਂ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ।',
            chipOne: 'ਡਾਟਾ ਦੀ ਸਪੱਸ਼ਟ ਵਰਤੋਂ',
            chipTwo: 'ਨੀਤੀ ਅਪਡੇਟ ਸਾਂਝੇ ਕੀਤੇ ਜਾਂਦੇ ਹਨ',
            updatedLabel: 'ਆਖਰੀ ਅਪਡੇਟ',
            sectionMini: 'SRV ਪਰਾਈਵੇਸੀ ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼',
            sections: [
              { title: '1. ਜਾਣਕਾਰੀ ਇਕੱਠੀ ਕਰਨਾ', content: 'ਅਕਾਊਂਟ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਦੌਰਾਨ ਅਸੀਂ ਤੁਹਾਡਾ ਨਾਮ, ਫੋਨ ਨੰਬਰ, ਈਮੇਲ ਅਤੇ ਕਾਰੋਬਾਰੀ ਵੇਰਵੇ ਵਰਗੀ ਨਿੱਜੀ ਜਾਣਕਾਰੀ ਇਕੱਠੀ ਕਰਦੇ ਹਾਂ। ਨਾਲ ਹੀ ਸਕੈਨ ਇਤਿਹਾਸ, ਰਿਵਾਰਡ ਪੌਇੰਟ ਅਤੇ ਐਪ ਵਰਤੋਂ ਨਾਲ ਸੰਬੰਧਿਤ ਡਾਟਾ ਵੀ ਇਕੱਠਾ ਹੁੰਦਾ ਹੈ।' },
              { title: '2. ਜਾਣਕਾਰੀ ਦੀ ਵਰਤੋਂ', content: 'ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਸੇਵਾਵਾਂ ਦੇਣ ਅਤੇ ਸੁਧਾਰਣ, ਰਿਵਾਰਡ ਪੌਇੰਟ ਲੈਣ-ਦੇਣ ਪ੍ਰੋਸੈਸ ਕਰਨ, ਅਕਾਊਂਟ ਸੰਬੰਧੀ ਸੰਪਰਕ ਕਰਨ ਅਤੇ ਤੁਹਾਡੀ ਸਹਿਮਤੀ ਨਾਲ ਪ੍ਰਮੋਸ਼ਨਲ ਨੋਟੀਫਿਕੇਸ਼ਨ ਭੇਜਣ ਲਈ ਵਰਤੀ ਜਾਂਦੀ ਹੈ।' },
              { title: '3. ਡਾਟਾ ਸੁਰੱਖਿਆ', content: 'ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਨੂੰ ਗੈਰ-ਅਨੁਮਤ ਪਹੁੰਚ, ਤਬਦੀਲੀ, ਖੁਲਾਸੇ ਜਾਂ ਨਸ਼ਟ ਹੋਣ ਤੋਂ ਬਚਾਉਣ ਲਈ ਅਸੀਂ ਢੰਗ ਦੇ ਸੁਰੱਖਿਆ ਉਪਾਅ ਲਾਗੂ ਕਰਦੇ ਹਾਂ।' },
              { title: '4. ਜਾਣਕਾਰੀ ਸਾਂਝੀ ਕਰਨਾ', content: 'ਅਸੀਂ ਤੁਹਾਡੀ ਨਿੱਜੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਵੇਚਦੇ। ਜ਼ਰੂਰਤ ਮੁਤਾਬਕ ਅਸੀਂ ਕਨੇਕਟਡ ਡੀਲਰਾਂ (ਇਲੈਕਟ੍ਰੀਸ਼ਨ ਅਕਾਊਂਟ ਲਈ) ਅਤੇ ਐਪ ਚਲਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਨ ਵਾਲੇ ਸੇਵਾ ਪ੍ਰਦਾਤਾਵਾਂ ਨਾਲ ਗੋਪਨੀਯਤਾ ਸਮਝੌਤੇ ਅਧੀਨ ਡਾਟਾ ਸਾਂਝਾ ਕਰ ਸਕਦੇ ਹਾਂ।' },
              { title: '5. ਯੂਜ਼ਰ ਅਧਿਕਾਰ', content: 'ਤੁਹਾਨੂੰ ਐਪ ਸੈਟਿੰਗਾਂ ਜਾਂ ਸਪੋਰਟ ਟੀਮ ਨਾਲ ਸੰਪਰਕ ਕਰਕੇ ਆਪਣੀ ਜਾਣਕਾਰੀ ਵੇਖਣ, ਅਪਡੇਟ ਕਰਨ ਜਾਂ ਮਿਟਾਉਣ ਦਾ ਅਧਿਕਾਰ ਹੈ।' },
              { title: '6. ਕੁਕੀਜ਼ ਅਤੇ ਟ੍ਰੈਕਿੰਗ', content: 'ਐਪ ਦੀ ਕਾਰਗੁਜ਼ਾਰੀ ਬਣਾਈ ਰੱਖਣ ਅਤੇ ਵਰਤੋਂ ਦੇ ਪੈਟਰਨ ਸਮਝਣ ਲਈ ਅਸੀਂ ਕੁਕੀਜ਼ ਅਤੇ ਮਿਲਦੀ-ਜੁਲਦੀ ਟ੍ਰੈਕਿੰਗ ਤਕਨੀਕਾਂ ਵਰਤਦੇ ਹਾਂ। ਤੁਸੀਂ ਡਿਵਾਈਸ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਕੁਕੀ ਪਸੰਦਾਂ ਬਦਲ ਸਕਦੇ ਹੋ।' },
              { title: '7. ਤੀਜੇ ਪੱਖ ਦੇ ਲਿੰਕ', content: 'ਸਾਡੇ ਐਪ ਵਿੱਚ ਤੀਜੇ ਪੱਖ ਦੀਆਂ ਵੈਬਸਾਈਟਾਂ ਦੇ ਲਿੰਕ ਹੋ ਸਕਦੇ ਹਨ। ਉਹਨਾਂ ਬਾਹਰੀ ਸਾਈਟਾਂ ਦੀ ਪਰਾਈਵੇਸੀ ਪ੍ਰੈਕਟਿਸ ਲਈ ਅਸੀਂ ਜ਼ਿੰਮੇਵਾਰ ਨਹੀਂ ਹਾਂ।' },
              { title: '8. ਬੱਚਿਆਂ ਦੀ ਪਰਾਈਵੇਸੀ', content: 'ਸਾਡੀਆਂ ਸੇਵਾਵਾਂ 18 ਸਾਲ ਤੋਂ ਘੱਟ ਉਮਰ ਵਾਲੇ ਯੂਜ਼ਰਾਂ ਲਈ ਨਹੀਂ ਹਨ। ਅਸੀਂ ਨਾਬਾਲਗਾਂ ਤੋਂ ਜਾਣ-ਬੁੱਝ ਕੇ ਡਾਟਾ ਇਕੱਠਾ ਨਹੀਂ ਕਰਦੇ।' },
              { title: '9. ਨੀਤੀ ਵਿੱਚ ਬਦਲਾਅ', content: 'ਅਸੀਂ ਸਮੇਂ-ਸਮੇਂ ਤੇ ਇਸ ਪਰਾਈਵੇਸੀ ਨੀਤੀ ਨੂੰ ਅਪਡੇਟ ਕਰ ਸਕਦੇ ਹਾਂ। ਵੱਡੇ ਬਦਲਾਵਾਂ ਬਾਰੇ ਅਸੀਂ ਐਪ ਨੋਟੀਫਿਕੇਸ਼ਨ ਜਾਂ ਈਮੇਲ ਰਾਹੀਂ ਜਾਣਕਾਰੀ ਦੇਵਾਂਗੇ।' },
              { title: '10. ਸੰਪਰਕ ਕਰੋ', content: 'ਪਰਾਈਵੇਸੀ ਨਾਲ ਸੰਬੰਧਿਤ ਪ੍ਰਸ਼ਨਾਂ ਲਈ ਸੰਪਰਕ ਕਰੋ:\nEmail: info@srvelectricals.com\nPhone: +91 8837684004' },
            ],
          }
        : {
            heroTitle: 'Your data stays protected with SRV',
            heroText:
              'We keep this policy simple so dealers and electricians can quickly understand what we collect, why we use it, and how you stay in control.',
            chipOne: tx('Clear use of data'),
            chipTwo: tx('Policy updates shared'),
            updatedLabel: tx('Last updated'),
            sectionMini: 'SRV privacy guideline',
            sections: [
              { title: '1. Information Collection', content: 'We collect personal information such as your name, phone number, email address, and business details when you register for an account. We also collect usage data including scan history, reward points, and app interactions.' },
              { title: '2. Use of Information', content: 'Your information is used to provide and improve our services, process reward point transactions, communicate with you about your account, and send promotional notifications with your consent.' },
              { title: '3. Data Security', content: 'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.' },
              { title: '4. Information Sharing', content: 'We do not sell your personal information. We may share data with connected dealers (for electrician accounts) and service providers who assist in operating our app, subject to confidentiality agreements.' },
              { title: '5. User Rights', content: 'You have the right to access, update, or delete your personal information at any time through the app settings or by contacting our support team.' },
              { title: '6. Cookies & Tracking', content: 'We use cookies and similar tracking technologies to maintain app functionality and analyze usage patterns. You can manage cookie preferences in your device settings.' },
              { title: '7. Third-Party Links', content: 'Our app may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.' },
              { title: "8. Children's Privacy", content: 'Our services are not intended for users under 18 years of age. We do not knowingly collect information from minors.' },
              { title: '9. Policy Changes', content: 'We may update this Privacy Policy periodically. We will notify you of significant changes through app notifications or emails.' },
              { title: '10. Contact Us', content: 'For privacy-related queries, contact us at:\nEmail: info@srvelectricals.com\nPhone: +91 8837684004' },
            ],
          };

  return (
    <>
      <View style={[styles.heroCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <AppIcon name="lock" size={18} color={theme.accent} />
          </View>
          <View style={styles.heroMeta}>
            <Text style={[styles.heroEyebrow, { color: theme.textMuted }]}>
              {pageContent.pageTitle || tx('Privacy Policy')}
            </Text>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
              {privacyCopy.heroTitle}
            </Text>
          </View>
        </View>
        <Text style={[styles.heroText, { color: theme.textSecondary }]}>
          {privacyCopy.heroText}
        </Text>
        <View style={styles.heroChips}>
          <View style={[styles.heroChip, { backgroundColor: theme.surface }]}>
            <AppIcon name="check" size={12} color={C.success} />
            <Text style={[styles.heroChipText, { color: theme.textPrimary }]}>
              {privacyCopy.chipOne}
            </Text>
          </View>
          <View style={[styles.heroChip, { backgroundColor: theme.surface }]}>
            <AppIcon name="notification" size={12} color={C.blue} />
            <Text style={[styles.heroChipText, { color: theme.textPrimary }]}>
              {privacyCopy.chipTwo}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.policyDateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.policyDateInner}>
          <View style={[styles.policyDateIcon, { backgroundColor: theme.accentSoft }]}>
            <AppIcon name="history" size={16} color={theme.accent} />
          </View>
          <View>
            <Text style={[styles.policyDateLabel, { color: theme.textMuted }]}>
              {privacyCopy.updatedLabel}
            </Text>
            <Text style={[styles.policyDateText, { color: theme.textPrimary }]}>April 2026</Text>
          </View>
        </View>
      </View>

      {privacyCopy.sections.map((section, index) => (
        <View
          key={index}
          style={[styles.policySection, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <View style={styles.policySectionGlow} />
          <View style={styles.policySectionHeader}>
            <View style={[styles.policySectionNumberWrap, { borderColor: theme.border }]}>
              <View style={[styles.policySectionNumber, { backgroundColor: theme.accentSoft }]}>
                <Text style={styles.policySectionNumberText}>{index + 1}</Text>
              </View>
            </View>
            <View style={styles.policySectionTitleWrap}>
              <Text style={[styles.policySectionTitle, { color: theme.textPrimary }]}>
                {section.title}
              </Text>
              <Text style={[styles.policySectionMini, { color: theme.textMuted }]}>
                {privacyCopy.sectionMini}
              </Text>
            </View>
          </View>
          <View style={[styles.policyDivider, { backgroundColor: theme.border }]} />
          <Text style={[styles.policySectionContent, { color: theme.textSecondary }]}>
            {section.content}
          </Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 14 },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(232,69,60,0.14)',
    top: -38,
    right: -26,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(37,99,235,0.12)',
    bottom: -28,
    left: -24,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: { flex: 1 },
  heroEyebrow: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { fontSize: 22, lineHeight: 28, fontWeight: '900', marginTop: 4 },
  heroText: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroChipText: { fontSize: 12, fontWeight: '700' },
  policyDateCard: { borderWidth: 1, borderRadius: 20, padding: 14 },
  policyDateInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  policyDateIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyDateLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  policyDateText: { fontSize: 15, fontWeight: '800' },
  policySection: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 18, opacity: 0.06, elevation: 3 }),
  },
  policySectionGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37,99,235,0.08)',
    top: -46,
    right: -30,
  },
  policySectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  policySectionNumberWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policySectionNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policySectionNumberText: { fontSize: 13, fontWeight: '800', color: C.primary },
  policySectionTitleWrap: { flex: 1 },
  policySectionTitle: { fontSize: 15, fontWeight: '800' },
  policySectionMini: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  policyDivider: { height: 1, marginBottom: 12, opacity: 0.7 },
  policySectionContent: { fontSize: 13, lineHeight: 21 },
});
