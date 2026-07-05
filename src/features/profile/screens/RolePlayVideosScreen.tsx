import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Path } from 'react-native-svg';
import { EmptyState, PageHeader } from '../components/ProfileShared';
import { playsApi, type PlayInteractions, type PlayVideo } from '@/shared/api/services';
import { resolveImageUrl } from '@/shared/api/config';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import { usePreferenceContext } from '@/shared/preferences';
import type { UserRole } from '@/shared/types/navigation';
import { formatISTDate } from '@/shared/utils/dateIST';

type VideoCategoryKey = 'all' | 'guides' | 'reels' | 'tips';

const VIDEO_FILTERS: { id: VideoCategoryKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'guides', label: 'Guides' },
  { id: 'reels', label: 'Reels' },
  { id: 'tips', label: 'Tips' },
];

const EMPTY_INTERACTIONS: PlayInteractions = {
  playId: '',
  likeCount: 0,
  shareCount: 0,
  likedByMe: false,
  comments: [],
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
    if (match?.[1]) return match[1];
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

function HeartActionIcon({ active }: { active: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={active ? '#FB7185' : 'none'}>
      <Path
        d="M20.5 8.8c0 5.1-8.5 9.8-8.5 9.8S3.5 13.9 3.5 8.8A4.4 4.4 0 0 1 12 6.9a4.4 4.4 0 0 1 8.5 1.9z"
        stroke={active ? '#FB7185' : '#FFFFFF'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CommentActionIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 18.2 3.8 20V7.8A3.8 3.8 0 0 1 7.6 4h8.8A3.8 3.8 0 0 1 20.2 7.8v5.8a3.8 3.8 0 0 1-3.8 3.8H8.5L6 18.2z"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 9.2h8M8 12.4h5.2" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ShareActionIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12.8 20 4l-4.4 16-3.3-6.3L4 12.8z"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M20 4 12.3 13.7" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function OpenActionIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5H6.5A2.5 2.5 0 0 0 4 7.5v10A2.5 2.5 0 0 0 6.5 20h10a2.5 2.5 0 0 0 2.5-2.5V15" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 4h6v6M20 4l-9 9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function YouTubePlayer({ videoId, active }: { videoId: string; active: boolean }) {
  return (
    <WebView
      source={{
        uri: `https://www.youtube.com/embed/${videoId}?autoplay=${active ? '1' : '0'}&playsinline=1&rel=0&modestbranding=1&controls=1&mute=0`,
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

function DirectVideoPlayer({ videoUrl, active }: { videoUrl: string; active: boolean }) {
  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = true;
    instance.muted = false;
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
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
  const { isAuthenticated } = useAuth();
  const { width, height } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<PlayVideo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategoryKey>('all');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [interactionsMap, setInteractionsMap] = useState<Record<string, PlayInteractions>>({});
  const [commentVideo, setCommentVideo] = useState<PlayVideo | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const viewedRef = useRef<Set<string>>(new Set());

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await playsApi.getAll(currentRole);
      const normalized = (response.data ?? []).map((video) => ({
        ...video,
        videoUrl: resolveImageUrl(video.videoUrl) ?? video.videoUrl,
        thumbnailUrl: resolveImageUrl(video.thumbnailUrl) ?? video.thumbnailUrl,
      }));
      const ordered = normalized.sort((a, b) => {
        const orderGap = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        if (orderGap !== 0) return orderGap;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setVideos(ordered);
      setActiveVideoId((current) => current ?? ordered[0]?.id ?? null);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'all') return videos;
    return videos.filter((video) => normalizeVideoCategory(video.category) === selectedCategory);
  }, [selectedCategory, videos]);

  useEffect(() => {
    setActiveVideoId(filteredVideos[0]?.id ?? null);
  }, [filteredVideos]);

  const hydrateInteractions = useCallback(async (video: PlayVideo) => {
    if (!isAuthenticated) {
      setInteractionsMap((current) => ({
        ...current,
        [video.id]: {
          playId: video.id,
          likeCount: video.likeCount ?? 0,
          shareCount: video.shareCount ?? 0,
          likedByMe: false,
          comments: [],
        },
      }));
      return;
    }

    try {
      const response = await playsApi.getInteractions(video.id);
      setInteractionsMap((current) => ({ ...current, [video.id]: response }));
    } catch {
      setInteractionsMap((current) => ({
        ...current,
        [video.id]: {
          playId: video.id,
          likeCount: video.likeCount ?? 0,
          shareCount: video.shareCount ?? 0,
          likedByMe: false,
          comments: [],
        },
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const video = filteredVideos.find((item) => item.id === activeVideoId);
    if (!video) return;

    void hydrateInteractions(video);

    if (isAuthenticated && !viewedRef.current.has(video.id)) {
      viewedRef.current.add(video.id);
      setVideos((current) =>
        current.map((item) =>
          item.id === video.id ? { ...item, viewCount: (item.viewCount ?? 0) + 1 } : item
        )
      );
      playsApi.recordView(video.id).catch(() => undefined);
    }
  }, [activeVideoId, filteredVideos, hydrateInteractions, isAuthenticated]);

  const requireLogin = () => {
    Alert.alert(tx('Login required'), tx('Please login to like or comment on videos.'));
  };

  const handleLike = async (video: PlayVideo) => {
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    const previous = interactionsMap[video.id];
    const optimistic = {
      ...(previous ?? EMPTY_INTERACTIONS),
      playId: video.id,
      likedByMe: !(previous?.likedByMe ?? false),
      likeCount: Math.max(
        0,
        (previous?.likeCount ?? video.likeCount ?? 0) + (previous?.likedByMe ? -1 : 1),
      ),
    };
    setInteractionsMap((current) => ({ ...current, [video.id]: optimistic }));

    try {
      const updated = await playsApi.toggleLike(video.id);
      setInteractionsMap((current) => ({ ...current, [video.id]: updated }));
    } catch {
      if (previous) setInteractionsMap((current) => ({ ...current, [video.id]: previous }));
    }
  };

  const handleShare = async (video: PlayVideo) => {
    try {
      await Share.share({
        title: video.title,
        message: `${video.title}\n${video.videoUrl}`,
        url: video.videoUrl,
      });
      if (isAuthenticated) {
        const updated = await playsApi.recordShare(video.id);
        setInteractionsMap((current) => ({ ...current, [video.id]: updated }));
      }
    } catch {
      // Native share can be cancelled by the user; no noisy alert needed.
    }
  };

  const openComments = (video: PlayVideo) => {
    setCommentVideo(video);
    void hydrateInteractions(video);
  };

  const submitComment = async () => {
    if (!commentVideo || !commentDraft.trim()) return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    setSubmittingComment(true);
    try {
      const updated = await playsApi.addComment(commentVideo.id, commentDraft.trim());
      setInteractionsMap((current) => ({ ...current, [commentVideo.id]: updated }));
      setCommentDraft('');
    } catch {
      Alert.alert(tx('Comment failed'), tx('Please try again in a moment.'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item?: PlayVideo }> }) => {
    const next = viewableItems[0]?.item;
    if (next?.id) setActiveVideoId(next.id);
  }).current;

  const reelHeight = Math.max(560, height - 92);
  const reelWidth = width;

  const renderReel = ({ item }: { item: PlayVideo }) => {
    const interactions = interactionsMap[item.id] ?? {
      playId: item.id,
      likeCount: item.likeCount ?? 0,
      shareCount: item.shareCount ?? 0,
      likedByMe: false,
      comments: [],
    };
    const thumbnail = getThumbnail(item);
    const youtubeId = isYouTube(item.videoUrl) ? getYouTubeVideoId(item.videoUrl) : null;
    const active = item.id === activeVideoId;

    return (
      <View style={[styles.reel, { width: reelWidth, height: reelHeight, backgroundColor: '#050816' }]}>
        <View style={styles.videoSurface}>
          {youtubeId ? (
            <YouTubePlayer videoId={youtubeId} active={active} />
          ) : isDirectVideo(item.videoUrl) ? (
            <DirectVideoPlayer videoUrl={item.videoUrl} active={active} />
          ) : thumbnail ? (
            <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[styles.videoFallback, { backgroundColor: theme.soft }]}>
              <Text style={[styles.videoFallbackText, { color: theme.textPrimary }]}>{tx('Unable to preview this video')}</Text>
            </View>
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.82)']} style={styles.videoShade} />
        </View>

        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backPill}>
            <Text style={styles.backPillText}>{tx('Back')}</Text>
          </Pressable>
          <View style={styles.filterRow}>
            {VIDEO_FILTERS.map((filter) => {
              const selected = selectedCategory === filter.id;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setSelectedCategory(filter.id)}
                  style={[styles.filterChip, selected && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                    {tx(filter.label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.actionRail}>
          <Pressable onPress={() => handleLike(item)} style={styles.actionButton}>
            <View style={[styles.actionIcon, interactions.likedByMe && styles.likedIcon]}>
              <HeartActionIcon active={interactions.likedByMe} />
            </View>
            <Text style={styles.actionText}>{interactions.likeCount}</Text>
          </Pressable>
          <Pressable onPress={() => openComments(item)} style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <CommentActionIcon />
            </View>
            <Text style={styles.actionText}>{interactions.comments.length}</Text>
          </Pressable>
          <Pressable onPress={() => handleShare(item)} style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <ShareActionIcon />
            </View>
            <Text style={styles.actionText}>{interactions.shareCount}</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(item.videoUrl).catch(() => undefined)} style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <OpenActionIcon />
            </View>
            <Text style={styles.actionText}>{tx('Open')}</Text>
          </Pressable>
        </View>

        <View style={styles.caption}>
          <View style={styles.metaRow}>
            <Text style={styles.categoryText}>{tx(normalizeVideoCategory(item.category).toUpperCase())}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{item.viewCount ?? 0} {tx('views')}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {item.description ? <Text style={styles.description} numberOfLines={3}>{item.description}</Text> : null}
          <Text style={styles.dateText}>{formatISTDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (appSettings?.playEnabled === false) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.bg }]}>
        <PageHeader title={tx('Play Zone')} onBack={onBack} />
        <View style={styles.disabledWrap}>
          <EmptyState
            iconName="play"
            title={tx('Play Zone is temporarily disabled')}
            message={tx('Videos will appear here again once SRV Team enables Play Zone from settings.')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#050816' }]}>
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.loadingText}>{tx('Loading videos...')}</Text>
        </View>
      ) : filteredVideos.length === 0 ? (
        <View style={[styles.screen, { backgroundColor: theme.bg }]}>
          <PageHeader title={tx('Play Zone')} onBack={onBack} />
          <View style={styles.disabledWrap}>
            <EmptyState
              iconName="play"
              title={tx('No videos available yet')}
              message={tx('Fresh videos for this profile will appear here once SRV Team uploads them.')}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => item.id}
          renderItem={renderReel}
          pagingEnabled
          snapToInterval={reelHeight}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
          getItemLayout={(_, index) => ({ length: reelHeight, offset: reelHeight * index, index })}
        />
      )}

      <Modal visible={Boolean(commentVideo)} animationType="slide" transparent onRequestClose={() => setCommentVideo(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setCommentVideo(null)} />
        <View style={[styles.commentSheet, { backgroundColor: theme.surface }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.commentHeader}>
            <Text style={[styles.commentTitle, { color: theme.textPrimary }]}>{tx('Comments')}</Text>
            <Pressable onPress={() => setCommentVideo(null)} style={styles.closeBtn}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
          </View>

          <FlatList
            data={(commentVideo ? interactionsMap[commentVideo.id]?.comments : []) ?? []}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            ListEmptyComponent={
              <Text style={[styles.emptyComments, { color: theme.textMuted }]}>{tx('No comments yet. Start the conversation.')}</Text>
            }
            renderItem={({ item }) => (
              <View style={[styles.commentCard, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                <View style={styles.commentMeta}>
                  <Text style={[styles.commentAuthor, { color: theme.textPrimary }]}>{item.authorName || tx('SRV User')}</Text>
                  <Text style={[styles.commentDate, { color: theme.textMuted }]}>{formatISTDate(item.createdAt)}</Text>
                </View>
                <Text style={[styles.commentMessage, { color: theme.textSecondary }]}>{item.message}</Text>
                {(item.replies ?? []).map((reply) => (
                  <View key={reply.id} style={[styles.replyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <Text style={[styles.replyAuthor, { color: theme.accent }]}>{reply.authorName || tx('Admin Team')}</Text>
                    <Text style={[styles.replyMessage, { color: theme.textSecondary }]}>{reply.message}</Text>
                  </View>
                ))}
              </View>
            )}
          />

          <View style={[styles.commentInputRow, { borderTopColor: theme.border }]}>
            <TextInput
              value={commentDraft}
              onChangeText={setCommentDraft}
              placeholder={isAuthenticated ? tx('Add a comment...') : tx('Login to comment')}
              placeholderTextColor={theme.textMuted}
              editable={isAuthenticated && !submittingComment}
              style={[styles.commentInput, { backgroundColor: theme.bg, color: theme.textPrimary, borderColor: theme.border }]}
            />
            <Pressable
              onPress={submitComment}
              disabled={!commentDraft.trim() || submittingComment || !isAuthenticated}
              style={[styles.sendButton, { opacity: !commentDraft.trim() || submittingComment || !isAuthenticated ? 0.45 : 1 }]}
            >
              <Text style={styles.sendText}>{submittingComment ? tx('Posting') : tx('Send')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  disabledWrap: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reel: {
    position: 'relative',
    overflow: 'hidden',
  },
  videoSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  videoShade: {
    ...StyleSheet.absoluteFillObject,
  },
  videoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  videoFallbackText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  topBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 14,
    gap: 12,
  },
  backPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  backPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.36)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
  },
  filterChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  filterChipTextActive: {
    color: '#111827',
  },
  actionRail: {
    position: 'absolute',
    right: 12,
    bottom: 136,
    gap: 16,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    color: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  likedIcon: {
    color: '#FB7185',
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  caption: {
    position: 'absolute',
    left: 18,
    right: 78,
    bottom: 34,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  categoryText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dot: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '900',
  },
  metaText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  description: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  dateText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '700',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.44)',
  },
  commentSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    minHeight: '54%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    marginBottom: 10,
  },
  commentHeader: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  closeText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  commentsList: {
    paddingHorizontal: 16,
  },
  emptyComments: {
    textAlign: 'center',
    paddingVertical: 34,
    fontSize: 13,
    fontWeight: '700',
  },
  commentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 7,
  },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '900',
  },
  commentDate: {
    fontSize: 10,
    fontWeight: '700',
  },
  commentMessage: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  replyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginLeft: 12,
    marginTop: 6,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
  },
  replyMessage: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  commentInputRow: {
    borderTopWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  sendButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
