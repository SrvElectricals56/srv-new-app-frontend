import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import { ratingApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { Dialog } from '@/shared/components/Dialog';

export function RateUsPage({ onBack, onHome }: { onBack: () => void; onHome?: () => void }) {
  const { tx, theme, language } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'rate_us');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [displayConsent, setDisplayConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'error' | 'info' | 'success'; title: string; message?: string }>({ visible: false, variant: 'info', title: '', message: '' });
  // Load existing rating on mount
  useEffect(() => {
    ratingApi.get().then((res) => {
      if (res) {
        setRating(res.rating ?? 0);
        setReview(res.review ?? '');
        setDisplayConsent(Boolean(res.displayConsent));
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
      await ratingApi.submit(rating, review.trim() || undefined, displayConsent);
      setSubmitted(true);
    } catch (error: any) {
      setDialog({
        visible: true,
        variant: 'error',
        title: tx('Rating not saved'),
        message: error?.message || tx('Please try again.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const ratingMessage =
    rating >= 5
      ? rateCopy.excellent
      : rating >= 4
        ? rateCopy.veryGood
        : rating >= 3
          ? rateCopy.good
          : rating >= 2
            ? rateCopy.needsImprovement
            : rating === 1
              ? rateCopy.better
              : rateCopy.defaultScale;

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
              {tx('Your feedback helps us improve. You can update it anytime.')}
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
            {review.trim() ? (
              <View style={[styles.savedReviewBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[styles.savedReviewLabel, { color: theme.textMuted }]}>{tx('Your review')}</Text>
                <Text style={[styles.savedReviewText, { color: theme.textPrimary }]}>{review.trim()}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={[styles.editRatingBtn, { backgroundColor: theme.accent }]}
              onPress={() => setSubmitted(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.editRatingText}>{tx('Edit Rating')}</Text>
            </TouchableOpacity>
            {onHome ? (
              <TouchableOpacity
                style={[styles.homeBtn, { borderColor: theme.border, backgroundColor: theme.bg }]}
                onPress={onHome}
                activeOpacity={0.85}
              >
                <Text style={[styles.homeBtnText, { color: theme.textPrimary }]}>{tx('Go to Home')}</Text>
              </TouchableOpacity>
            ) : null}
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
              <View style={styles.heroBrandRow}>
                <View style={styles.heroIconWrap}>
                  <AppIcon name="star" size={24} color={theme.accent} />
                </View>
                <View style={styles.heroBrandTextWrap}>
                  <Text style={[styles.heroEyebrow, { color: theme.textMuted }]}>
                    {tx('Welcome from SRV')}
                  </Text>
                  <Text style={[styles.heroBrandName, { color: theme.textPrimary }]}>
                    SRV Electricals
                  </Text>
                </View>
              </View>
              <Text style={[styles.rateTitle, { color: theme.textPrimary }]}>
                {tx('Rate your app experience')}
              </Text>
              <Text style={[styles.rateSubtitle, { color: theme.textSecondary }]}>
                {tx('Your review helps us improve support, rewards, orders, and daily app experience.')}
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
                <View>
                  <Text style={[styles.rateSectionLabel, { color: theme.textPrimary }]}>
                    {rateCopy.selectRating}
                  </Text>
                  <Text style={[styles.rateSectionSub, { color: theme.textMuted }]}>
                    {tx('Tap once to choose your score')}
                  </Text>
                </View>
                <View style={[styles.ratingScorePill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.rateSectionMeta, { color: rating > 0 ? theme.accent : theme.textMuted }]}>
                    {rating > 0 ? `${rating}/5` : rateCopy.tapStar}
                  </Text>
                </View>
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
              <View style={[styles.ratingMessageBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <AppIcon name="star" size={16} color={theme.accent} />
                <Text style={[styles.rateScaleText, { color: theme.textPrimary }]}>{ratingMessage}</Text>
              </View>
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
                  maxLength={500}
                  style={[styles.reviewTextInput, { color: theme.textPrimary }]}
                />
              </View>
              {review.trim().length >= 10 ? (
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: displayConsent }}
                  activeOpacity={0.8}
                  onPress={() => setDisplayConsent((current) => !current)}
                  style={[styles.consentRow, { borderColor: theme.border, backgroundColor: theme.bg }]}
                >
                  <View style={[styles.consentBox, { borderColor: displayConsent ? theme.accent : theme.border, backgroundColor: displayConsent ? theme.accent : theme.surface }]}>
                    <Text style={styles.consentCheck}>{displayConsent ? '✓' : ''}</Text>
                  </View>
                  <Text style={[styles.consentText, { color: theme.textSecondary }]}>
                    {tx('Allow SRV to show this review in the app with my name and role. It may appear after 7 days.')}
                  </Text>
                </TouchableOpacity>
              ) : null}
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
            {onHome ? (
              <TouchableOpacity
                style={[styles.formHomeBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={onHome}
                activeOpacity={0.85}
              >
                <Text style={[styles.formHomeBtnText, { color: theme.textPrimary }]}>{tx('Go to Home')}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        onClose={() => setDialog((current) => ({ ...current, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 140, gap: 16 },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...createShadow({ color: '#0F172A', offsetY: 14, blur: 24, opacity: 0.1, elevation: 5 }),
  },
  heroGlowPrimary: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(239,68,68,0.12)',
    top: -82,
    right: -48,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(245,158,11,0.16)',
    bottom: -64,
    left: -42,
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  heroIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.14)',
    ...createShadow({ color: '#B91C1C', offsetY: 8, blur: 14, opacity: 0.12, elevation: 3 }),
  },
  heroBrandTextWrap: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroBrandName: { fontSize: 20, fontWeight: '900', lineHeight: 24 },
  rateCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 18, opacity: 0.06, elevation: 3 }),
  },
  rateTitle: { fontSize: 25, fontWeight: '900', marginBottom: 8, lineHeight: 31 },
  rateSubtitle: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  ratingHints: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingHintChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  ratingHintText: { fontSize: 12, fontWeight: '700' },
  rateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  rateSectionLabel: { fontSize: 16, fontWeight: '900' },
  rateSectionSub: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  ratingScorePill: {
    minWidth: 76,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rateSectionMeta: { fontSize: 12, fontWeight: '900' },
  starsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 14 },
  starBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingMessageBox: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rateScaleText: { fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '800', flexShrink: 1 },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 18, opacity: 0.05, elevation: 2 }),
  },
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
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  consentBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  consentCheck: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', lineHeight: 17 },
  consentText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  rateSubmitBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  rateSubmitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  formHomeBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHomeBtnText: { fontSize: 15, fontWeight: '900' },
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
  savedReviewBox: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 18,
  },
  savedReviewLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
  savedReviewText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  editRatingBtn: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  editRatingText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  homeBtn: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  homeBtnText: { fontSize: 15, fontWeight: '900' },
});
