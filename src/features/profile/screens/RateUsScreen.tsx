import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import { ratingApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';

export function RateUsPage({ onBack }: { onBack: () => void }) {
  const { tx, theme, language } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'rate_us');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Load existing rating on mount
  useEffect(() => {
    ratingApi.get().then((res) => {
      if (res) {
        setRating(res.rating ?? 0);
        setReview(res.review ?? '');
        setSubmitted(true);
      }
    }).catch(() => {});
  }, []);

  const rateCopy =
    language === 'Hindi'
      ? {
          reviewShared: 'रिव्यू साझा किया गया',
          hints: ['जल्दी फीडबैक', 'बेहतर सपोर्ट', 'ऐप सुधार'],
          selectRating: 'अपनी रेटिंग चुनें',
          tapStar: 'स्टार चुनें',
          optional: 'वैकल्पिक',
          excellent: 'बहुत शानदार अनुभव',
          veryGood: 'बहुत अच्छा अनुभव',
          good: 'अच्छा है, और बेहतर हो सकता है',
          needsImprovement: 'सुधार की जरूरत है',
          better: 'हम और बेहतर कर सकते हैं',
          defaultScale: 'आपका फीडबैक ऐप को बेहतर बनाता है',
        }
      : language === 'Punjabi'
        ? {
            reviewShared: 'ਰਿਵਿਊ ਸਾਂਝਾ ਕੀਤਾ ਗਿਆ',
            hints: ['ਤੁਰੰਤ ਫੀਡਬੈਕ', 'ਵਧੀਆ ਸਹਾਇਤਾ', 'ਐਪ ਸੁਧਾਰ'],
            selectRating: 'ਆਪਣੀ ਰੇਟਿੰਗ ਚੁਣੋ',
            tapStar: 'ਸਟਾਰ ਚੁਣੋ',
            optional: 'ਵਿਕਲਪਿਕ',
            excellent: 'ਸ਼ਾਨਦਾਰ ਤਜਰਬਾ',
            veryGood: 'ਬਹੁਤ ਵਧੀਆ ਤਜਰਬਾ',
            good: 'ਚੰਗਾ, ਹੋਰ ਸੁਧਾਰ ਹੋ ਸਕਦਾ ਹੈ',
            needsImprovement: 'ਸੁਧਾਰ ਦੀ ਲੋੜ ਹੈ',
            better: 'ਅਸੀਂ ਹੋਰ ਵਧੀਆ ਕਰ ਸਕਦੇ ਹਾਂ',
            defaultScale: 'ਤੁਹਾਡਾ ਫੀਡਬੈਕ ਐਪ ਸੁਧਾਰ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ',
          }
        : {
            reviewShared: 'Review shared',
            hints: ['Quick feedback', 'Better support', 'App improvements'],
            selectRating: 'Select your rating',
            tapStar: 'Tap a star',
            excellent: 'Excellent experience',
            veryGood: 'Very good experience',
            good: 'Good, but can improve',
            needsImprovement: 'Needs improvement',
            better: 'We can do much better',
            defaultScale: 'Your feedback helps us shape the app',
            optional: 'Optional',
          };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await ratingApi.submit(rating, review.trim() || undefined);
      setSubmitted(true);
    } catch {
      // silently fail — still show thank you
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <PageHeader title={pageContent.pageTitle || tx('Rate Us')} onBack={onBack} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {submitted ? (
          <View
            style={[
              styles.rateThankYou,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <View style={[styles.rateThankYouIcon, { backgroundColor: C.successLight }]}>
              <AppIcon name="star" size={42} color={C.success} />
            </View>
            <Text style={[styles.rateThankYouText, { color: theme.textPrimary }]}>
              {tx('Thank you for your rating!')}
            </Text>
            <Text style={[styles.rateThankYouSub, { color: theme.textMuted }]}>
              {tx('Your feedback helps us improve.')}
            </Text>
            <View style={styles.rateThankYouTags}>
              <View style={[styles.rateThankYouTag, { backgroundColor: theme.surface }]}>
                <Text style={[styles.rateThankYouTagText, { color: theme.textPrimary }]}>
                  {rating}/5 stars
                </Text>
              </View>
              {review.trim() ? (
                <View style={[styles.rateThankYouTag, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.rateThankYouTagText, { color: theme.textPrimary }]}>
                    {rateCopy.reviewShared}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.heroCard,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
            >
              <View style={styles.heroGlowPrimary} />
              <View style={styles.heroGlowSecondary} />
              <View style={styles.heroIconWrap}>
                <AppIcon name="star" size={24} color={theme.accent} />
              </View>
              <Text style={[styles.heroEyebrow, { color: theme.textMuted }]}>{pageContent.pageTitle || tx('Rate Us')}</Text>
              <Text style={[styles.rateTitle, { color: theme.textPrimary }]}>
                {tx('Rate the App')}
              </Text>
              <Text style={[styles.rateSubtitle, { color: theme.textSecondary }]}>
                {tx('How was your experience?')}
              </Text>
              <View style={styles.ratingHints}>
                {rateCopy.hints.map((item) => (
                  <View
                    key={item}
                    style={[styles.ratingHintChip, { backgroundColor: theme.surface }]}
                  >
                    <Text style={[styles.ratingHintText, { color: theme.textPrimary }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.rateCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.rateHeaderRow}>
                <Text style={[styles.rateSectionLabel, { color: theme.textPrimary }]}>
                  {rateCopy.selectRating}
                </Text>
                <Text style={[styles.rateSectionMeta, { color: theme.textMuted }]}>
                  {rating > 0 ? `${rating}/5` : rateCopy.tapStar}
                </Text>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={[
                      styles.starBtn,
                      {
                        backgroundColor: star <= rating ? theme.accentSoft : theme.bg,
                        borderColor: star <= rating ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <AppIcon
                      name="star"
                      size={30}
                      color={star <= rating ? theme.accent : theme.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.rateScaleText, { color: theme.textMuted }]}>
                {rating >= 5
                  ? rateCopy.excellent
                  : rating >= 4
                    ? rateCopy.veryGood
                    : rating >= 3
                      ? rateCopy.good
                      : rating >= 2
                        ? rateCopy.needsImprovement
                        : rating === 1
                          ? rateCopy.better
                          : rateCopy.defaultScale}
              </Text>
            </View>
            <View
              style={[
                styles.reviewCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.reviewTopRow}>
                <Text style={[styles.reviewLabel, { color: theme.textPrimary }]}>
                  {tx('Write a Review')}
                </Text>
                <View style={[styles.reviewBadge, { backgroundColor: theme.bg }]}>
                  <Text style={[styles.reviewBadgeText, { color: theme.textMuted }]}>
                    {rateCopy.optional}
                  </Text>
                </View>
              </View>
              <Text style={[styles.reviewHint, { color: theme.textMuted }]}>
                {tx('Share feedback about your experience with SRV app')}
              </Text>
              <View
                style={[
                  styles.reviewInput,
                  { borderColor: theme.border, backgroundColor: theme.bg },
                ]}
              >
                <TextInput
                  value={review}
                  onChangeText={setReview}
                  placeholder={tx('Your review')}
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={5}
                  style={[styles.reviewTextInput, { color: theme.textPrimary }]}
                />
              </View>
            </View>
      <TouchableOpacity
              style={[
                styles.rateSubmitBtn,
                { backgroundColor: rating > 0 ? theme.accent : theme.border },
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.rateSubmitBtnText}>{tx('Submit Rating')}</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 140, gap: 16 },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...createShadow({ color: '#0F172A', offsetY: 12, blur: 20, opacity: 0.08, elevation: 4 }),
  },
  heroGlowPrimary: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(232,69,60,0.16)',
    top: -64,
    right: -28,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(37,99,235,0.12)',
    bottom: -48,
    left: -26,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  rateCard: { borderWidth: 1, borderRadius: 24, padding: 20 },
  rateTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  rateSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 14 },
  ratingHints: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  ratingHintChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  ratingHintText: { fontSize: 12, fontWeight: '700' },
  rateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rateSectionLabel: { fontSize: 15, fontWeight: '800' },
  rateSectionMeta: { fontSize: 12, fontWeight: '700' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 14 },
  starBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateScaleText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  reviewCard: { borderWidth: 1, borderRadius: 24, padding: 20 },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewLabel: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  reviewBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  reviewBadgeText: { fontSize: 11, fontWeight: '700' },
  reviewHint: { fontSize: 12, marginBottom: 12 },
  reviewInput: { borderWidth: 1.5, borderRadius: 18, padding: 14, minHeight: 132 },
  reviewTextInput: { fontSize: 14, textAlignVertical: 'top', flex: 1, minHeight: 100 },
  rateSubmitBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  rateSubmitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rateThankYou: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    marginTop: 40,
  },
  rateThankYouIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  rateThankYouText: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  rateThankYouSub: { fontSize: 14, textAlign: 'center' },
  rateThankYouTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  rateThankYouTag: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  rateThankYouTagText: { fontSize: 12, fontWeight: '700' },
});
