import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { EmptyState, PageHeader } from '../components/ProfileShared';
import { playsApi, type PlayVideo } from '@/shared/api/services';
import { useAppData } from '@/shared/context/AppDataContext';
import { usePreferenceContext } from '@/shared/preferences';
import type { UserRole } from '@/shared/types/navigation';
import { formatISTDate } from '@/shared/utils/dateIST';

type VideoCategoryKey = 'all' | 'guides' | 'reels' | 'tips';

const VIDEO_FILTERS: { id: VideoCategoryKey; label: string }[] = [
  { id: 'all', label: 'All Videos' },
  { id: 'guides', label: 'Guides' },
  { id: 'reels', label: 'Quick Reels' },
  { id: 'tips', label: 'Helpful Tips' },
];

const ROLE_COPY: Record<UserRole, { eyebrow: string; subtitle: string }> = {
  dealer: {
    eyebrow: 'Dealer Library',
    subtitle: 'Business explainers, partner updates, and sales-ready videos for dealer accounts.',
  },
  electrician: {
    eyebrow: 'Electrician Library',
    subtitle: 'Installation guides, field demos, and practical product videos for electricians.',
  },
  counterboy: {
    eyebrow: 'Counter Boy Library',
    subtitle: 'Counter guidance, fast explainers, and customer-facing videos for the sales desk.',
  },
  user: {
    eyebrow: 'Customer Library',
    subtitle: 'Short product videos and helpful explainers selected for your account.',
  },
};

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url);
}

function normalizeVideoCategory(category: string): Exclude<VideoCategoryKey, 'all'> {
  const value = category.toLowerCase().trim();
  if (value.includes('guide')) return 'guides';
  if (value.includes('tip')) return 'tips';
  return 'reels';
}

function getThumbnail(video: PlayVideo): string | null {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  const youtubeId = isYouTube(video.videoUrl) ? getYouTubeVideoId(video.videoUrl) : null;
  return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null;
}

function YouTubePlayer({ videoId }: { videoId: string }) {
  return (
    <WebView
      source={{
        uri: `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&controls=1&mute=0`,
      }}
      style={StyleSheet.absoluteFill}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      onShouldStartLoadWithRequest={(request) =>
        request.url.includes('youtube.com/embed') ||
        request.url.includes('youtube.com/watch') ||
        request.url === 'about:blank'
      }
    />
  );
}

function DirectVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.play();
  });

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls />;
}

export function RolePlayVideosScreen({
  onBack,
  currentRole,
}: {
  onBack: () => void;
  currentRole: UserRole;
}) {
  const { tx, theme } = usePreferenceContext();
  const { appSettings } = useAppData();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<PlayVideo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategoryKey>('all');
  const [selectedVideo, setSelectedVideo] = useState<PlayVideo | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await playsApi.getAll();
      const ordered = [...(response.data ?? [])].sort((a, b) => {
        const orderGap = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        if (orderGap !== 0) return orderGap;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setVideos(ordered);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'all') return videos;
    return videos.filter((video) => normalizeVideoCategory(video.category) === selectedCategory);
  }, [selectedCategory, videos]);

  const openVideo = (video: PlayVideo) => {
    setVideos((current) =>
      current.map((item) =>
        item.id === video.id ? { ...item, viewCount: item.viewCount + 1 } : item
      )
    );
    setSelectedVideo({ ...video, viewCount: video.viewCount + 1 });
    playsApi.recordView(video.id).catch(() => {});
  };

  const heroCopy = ROLE_COPY[currentRole];
  const heroColors: [string, string] = [
    theme.accentSoft ?? '#FDECEC',
    theme.surface,
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <PageHeader title={tx('Play Zone')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={heroColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: theme.border }]}
        >
          <Text style={[styles.heroEyebrow, { color: theme.accent }]}>{tx(heroCopy.eyebrow)}</Text>
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>{tx('Videos')}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            {tx(heroCopy.subtitle)}
          </Text>
          <View style={styles.heroStatsRow}>
            <View style={[styles.heroStatCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.heroStatValue, { color: theme.textPrimary }]}>{videos.length}</Text>
              <Text style={[styles.heroStatLabel, { color: theme.textMuted }]}>{tx('total')}</Text>
            </View>
            <View style={[styles.heroStatCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.heroStatValue, { color: theme.textPrimary }]}>{filteredVideos.length}</Text>
              <Text style={[styles.heroStatLabel, { color: theme.textMuted }]}>{tx('visible')}</Text>
            </View>
          </View>
        </LinearGradient>

        {appSettings?.playEnabled === false ? (
          <View style={[styles.noticeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.noticeTitle, { color: theme.textPrimary }]}>{tx('Play Zone is temporarily disabled')}</Text>
            <Text style={[styles.noticeBody, { color: theme.textSecondary }]}>
              {tx('Videos will appear here again once SRV Team enables Play Zone from settings.')}
            </Text>
          </View>
        ) : null}

        {appSettings?.playEnabled === false ? null : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersWrap}
              style={styles.filtersScroller}
            >
              {VIDEO_FILTERS.map((filter) => {
                const active = selectedCategory === filter.id;
                return (
                  <Pressable
                    key={filter.id}
                    onPress={() => setSelectedCategory(filter.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? theme.accent : theme.surface,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {tx(filter.label)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {loading ? (
              <ActivityIndicator color={theme.accent} style={{ marginTop: 48 }} />
            ) : filteredVideos.length === 0 ? (
              <EmptyState
                iconName="play"
                title={tx('No videos available yet')}
                message={tx('Fresh videos for this profile will appear here once SRV Team uploads them.')}
              />
            ) : (
              <View style={styles.videoList}>
                {filteredVideos.map((video) => {
                  const thumbnail = getThumbnail(video);
                  return (
                    <Pressable
                      key={video.id}
                      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      onPress={() => openVideo(video)}
                    >
                      <View style={[styles.thumbnailFrame, { backgroundColor: theme.soft }]}>
                        {thumbnail ? (
                          <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                        ) : (
                          <View style={styles.thumbnailFallback}>
                            <Text style={[styles.thumbnailFallbackText, { color: theme.textPrimary }]}>
                              {tx('Play')}
                            </Text>
                          </View>
                        )}
                        <View style={styles.playBadge}>
                          <Text style={styles.playBadgeText}>Play</Text>
                        </View>
                      </View>
                      <View style={styles.cardBody}>
                        <View style={styles.cardMetaRow}>
                          <View style={[styles.categoryChip, { backgroundColor: theme.accentSoft ?? '#FDECEC' }]}>
                            <Text style={[styles.categoryChipText, { color: theme.accent }]}>
                              {tx(VIDEO_FILTERS.find((item) => item.id === normalizeVideoCategory(video.category))?.label ?? 'Video')}
                            </Text>
                          </View>
                          <Text style={[styles.viewsText, { color: theme.textMuted }]}>
                            {video.viewCount} {tx('views')}
                          </Text>
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                          {video.title}
                        </Text>
                        {video.description ? (
                          <Text style={[styles.cardDescription, { color: theme.textSecondary }]} numberOfLines={3}>
                            {video.description}
                          </Text>
                        ) : null}
                        <Text style={[styles.cardHint, { color: theme.accent }]}>{tx('Tap to watch')}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(selectedVideo)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedVideo(null)}
      >
        {selectedVideo ? (
          <View style={[styles.modalScreen, { backgroundColor: theme.bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
              <Pressable
                onPress={() => setSelectedVideo(null)}
                style={[styles.modalBackBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.modalBackText, { color: theme.textPrimary }]}>{tx('Back')}</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(selectedVideo.videoUrl).catch(() => {})}
                style={[styles.modalOpenBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.modalOpenText}>{tx('Open Source')}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFrame}>
                {isYouTube(selectedVideo.videoUrl) && getYouTubeVideoId(selectedVideo.videoUrl) ? (
                  <YouTubePlayer videoId={getYouTubeVideoId(selectedVideo.videoUrl)!} />
                ) : isDirectVideo(selectedVideo.videoUrl) ? (
                  <DirectVideoPlayer videoUrl={selectedVideo.videoUrl} />
                ) : getThumbnail(selectedVideo) ? (
                  <Image source={{ uri: getThumbnail(selectedVideo)! }} style={styles.modalFallbackImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.modalFallback, { backgroundColor: theme.soft }]}>
                    <Text style={[styles.modalFallbackText, { color: theme.textPrimary }]}>{tx('Unable to preview this video inline')}</Text>
                  </View>
                )}
              </View>
              <View style={styles.modalBody}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{selectedVideo.title}</Text>
                <Text style={[styles.modalMeta, { color: theme.textMuted }]}>
                  {selectedVideo.viewCount} {tx('views')} · {formatISTDate(selectedVideo.createdAt)}
                </Text>
                {selectedVideo.description ? (
                  <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                    {selectedVideo.description}
                  </Text>
                ) : null}
              </View>
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  heroStatCard: {
    minWidth: 92,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  noticeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  filtersScroller: {
    minHeight: 56,
  },
  filtersWrap: {
    gap: 10,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  videoList: {
    gap: 14,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnailFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailFallbackText: {
    fontSize: 18,
    fontWeight: '800',
  },
  playBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  playBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  viewsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  cardHint: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalScreen: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalBackBtn: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalBackText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalOpenBtn: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalOpenText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  modalFallbackImage: {
    width: '100%',
    height: '100%',
  },
  modalFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalFallbackText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  modalBody: {
    padding: 18,
    gap: 8,
  },
  modalTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
  },
  modalMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
});
