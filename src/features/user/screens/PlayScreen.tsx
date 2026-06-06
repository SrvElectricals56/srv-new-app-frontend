import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { usePreferenceContext } from '@/shared/preferences';
import { useAppData } from '@/shared/context/AppDataContext';
import {
  playsApi,
  type PlayComment,
  type PlayInteractions,
  type PlayVideo,
} from '@/shared/api/services';
import type { Screen } from '@/shared/types/navigation';

type VideoCategoryKey = 'all' | 'guides' | 'reels' | 'tips';

const VIDEO_FILTERS: { id: VideoCategoryKey; label: string }[] = [
  { id: 'all', label: 'All Videos' },
  { id: 'guides', label: 'Video Guides' },
  { id: 'reels', label: 'Quick Reels' },
  { id: 'tips', label: 'Helpful Tips' },
];

const CAT_COLORS: Record<Exclude<VideoCategoryKey, 'all'>, { bg: string; text: string; label: string }> = {
  reels: { bg: '#FBF1E7', text: '#8D4A1E', label: 'Quick Reel' },
  guides: { bg: '#F5E8DC', text: '#6A2F12', label: 'Video Guide' },
  tips: { bg: '#F0DEC9', text: '#6A2F12', label: 'Helpful Tip' },
};

const PLAY_HERO_CHIPS = ['Guides', 'Reels', 'Tips'];

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

function isYouTube(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function isDirectVideo(url: string): boolean {
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

function PlayIcon({ size = 44, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5.5v13l10-6.5-10-6.5z" fill={color} />
    </Svg>
  );
}

function PauseIcon({ size = 44, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 5h3v14H6zM15 5h3v14h-3z" fill={color} />
    </Svg>
  );
}

function EyeIcon({ size = 14, color = '#64748B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={1.8} />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function HeartIcon({ size = 18, color = '#E11D48', filled = false }: { size?: number; color?: string; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5s-7-4.35-9.25-8.53C.69 8.14 2.16 4.5 5.95 4.5c2.2 0 3.5 1.26 4.2 2.37.76-1.12 2.09-2.37 4.35-2.37 3.75 0 5.23 3.62 3.14 7.47C19.35 16.1 12 20.5 12 20.5Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function CommentIcon({ size = 18, color = '#475569' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 18.5 3.5 21V6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18 18H7Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M8 9h8M8 13h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6 18 18M18 6 6 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SendIcon({ size = 18, color = '#6A2F12' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21.5 3.5 10 15l-1.5 5.5L21.5 3.5Zm0 0L14 20l-2-7-7-2 16.5-7.5Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

function SparkIcon({ size = 16, color = '#F8FAFC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.8 14.4 9.6 21.2 12l-6.8 2.4L12 21.2l-2.4-6.8L2.8 12l6.8-2.4L12 2.8Z"
        fill={color}
      />
    </Svg>
  );
}

function YouTubePlayer({
  videoId,
  isActive,
}: {
  videoId: string;
  isActive: boolean;
}) {
  const webviewRef = useRef<WebView>(null);
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isActive ? 1 : 0}&playsinline=1&rel=0&modestbranding=1&controls=1&enablejsapi=1&mute=0`;

  useEffect(() => {
    if (!webviewRef.current) return;
    const js = isActive
      ? `document.querySelector('iframe')?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*'); true;`
      : `document.querySelector('iframe')?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); true;`;
    webviewRef.current.injectJavaScript(js);
  }, [isActive]);

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: embedUrl }}
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

function DirectVideoPlayer({
  video,
  isActive,
}: {
  video: PlayVideo;
  isActive: boolean;
}) {
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(video.videoUrl, (instance) => {
    instance.loop = true;
    instance.muted = false;
  });

  useEffect(() => {
    if (isActive && !paused) player.play();
    else player.pause();
  }, [isActive, paused, player]);

  const handleTap = () => {
    setPaused((current) => !current);
    setShowControls(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShowControls(false), 1200);
  };

  return (
    <>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
        {showControls ? (
          <View style={styles.controlOverlay}>
            <View style={styles.controlBtn}>{paused ? <PlayIcon /> : <PauseIcon />}</View>
          </View>
        ) : null}
      </Pressable>
    </>
  );
}

function VideoPreview({
  video,
  onPress,
}: {
  video: PlayVideo;
  onPress: () => void;
}) {
  const thumbnail = getThumbnail(video);

  return (
    <Pressable style={styles.previewButton} onPress={onPress}>
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.previewImage} resizeMode="cover" />
      ) : (
        <View style={styles.fallbackPreview}>
          <Text style={styles.fallbackPreviewText}>{video.title}</Text>
        </View>
      )}
      <View style={styles.previewOverlay}>
        <View style={styles.playCircle}>
          <PlayIcon size={30} />
        </View>
      </View>
    </Pressable>
  );
}

function VideoCard({
  video,
  onOpen,
}: {
  video: PlayVideo;
  onOpen: () => void;
}) {
  const category = normalizeVideoCategory(video.category);
  const palette = CAT_COLORS[category];

  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.videoFrame}>
        <VideoPreview video={video} onPress={onOpen} />
        <LinearGradient
          colors={['transparent', 'rgba(32,17,10,0.64)']}
          start={{ x: 0.5, y: 0.12 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.videoFrameShade}
        />
        <View style={styles.videoFrameMeta}>
          <Text style={styles.videoFrameKicker}>{palette.label}</Text>
          <Text style={styles.videoFrameOpen}>SRV Play</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.catBadge, { backgroundColor: palette.bg }]}>
            <Text style={[styles.catBadgeText, { color: palette.text }]}>{palette.label}</Text>
          </View>
          <View style={styles.viewsBadge}>
            <EyeIcon />
            <Text style={styles.viewsText}>{video.viewCount}</Text>
          </View>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        {video.description ? <Text style={styles.videoDesc} numberOfLines={2}>{video.description}</Text> : null}
        <View style={styles.openRow}>
          <Text style={styles.openRowText}>Tap to open full video</Text>
          <Text style={styles.openRowArrow}>Open</Text>
        </View>
      </View>
    </Pressable>
  );
}

function CommentRow({
  comment,
}: {
  comment: PlayComment;
}) {
  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHead}>
        <Text style={styles.commentAuthor}>{comment.authorName || 'SRV User'}</Text>
        <Text style={styles.commentMeta}>{comment.authorRole || 'customer'}</Text>
      </View>
      <Text style={styles.commentMessage}>{comment.message}</Text>
      <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
      {(comment.replies ?? []).map((reply) => (
        <View key={reply.id} style={styles.replyCard}>
          <Text style={styles.replyAuthor}>{reply.authorName || 'SRV Team'}</Text>
          <Text style={styles.replyMessage}>{reply.message}</Text>
          <Text style={styles.replyDate}>{new Date(reply.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}

function VideoOverlay({
  video,
  insets,
  interactions,
  interactionsLoading,
  interactionsSupported,
  commentDraft,
  submittingComment,
  liking,
  onClose,
  onCommentChange,
  onSubmitComment,
  onToggleLike,
}: {
  video: PlayVideo;
  insets: { top: number; bottom: number };
  interactions: PlayInteractions;
  interactionsLoading: boolean;
  interactionsSupported: boolean;
  commentDraft: string;
  submittingComment: boolean;
  liking: boolean;
  onClose: () => void;
  onCommentChange: (value: string) => void;
  onSubmitComment: () => void;
  onToggleLike: () => void;
}) {
  const category = normalizeVideoCategory(video.category);
  const palette = CAT_COLORS[category];
  const youtubeId = isYouTube(video.videoUrl) ? getYouTubeVideoId(video.videoUrl) : null;
  const direct = isDirectVideo(video.videoUrl);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView
          style={styles.overlayScroll}
          contentContainerStyle={[styles.overlayScrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overlayHero}>
            <View style={styles.overlayVideoFrame}>
              {youtubeId ? (
                <YouTubePlayer videoId={youtubeId} isActive />
              ) : direct ? (
                <DirectVideoPlayer video={video} isActive />
              ) : (
                <VideoPreview video={video} onPress={() => {}} />
              )}
            </View>
            <View style={styles.overlayShade} />
            <View style={[styles.overlayHeroTopRow, { paddingTop: insets.top + 12 }]}>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <CloseIcon />
              </Pressable>
              <View style={styles.overlayHeaderTextWrap}>
                <Text style={styles.overlayKicker}>{palette.label}</Text>
                <Text style={styles.overlayTitle}>{video.title}</Text>
              </View>
            </View>
            <View style={styles.overlayHeroBottom}>
              <View style={styles.overlayStatsRow}>
                <View style={[styles.overlayBadge, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.overlayBadgeText, { color: palette.text }]}>{palette.label}</Text>
                </View>
                <View style={styles.overlayStatPill}>
                  <EyeIcon color="#E2E8F0" />
                  <Text style={styles.overlayStatText}>{video.viewCount} views</Text>
                </View>
                <View style={styles.overlayStatPill}>
                  <CommentIcon size={16} color="#E2E8F0" />
                  <Text style={styles.overlayStatText}>{interactions.comments.length} comments</Text>
                </View>
              </View>
              {video.description ? <Text style={styles.overlayDescription}>{video.description}</Text> : null}
            </View>
          </View>

          <View style={[styles.overlayBody, { paddingBottom: insets.bottom + 28 }]}>
            <View style={styles.actionRow}>
              <Pressable style={styles.likeButton} onPress={onToggleLike} disabled={liking || !interactionsSupported}>
                <HeartIcon filled={interactions.likedByMe} color={interactions.likedByMe ? '#E11D48' : '#64748B'} />
                <Text style={[styles.likeButtonText, interactions.likedByMe ? styles.likeButtonTextActive : null]}>
                  {interactions.likedByMe ? 'Liked' : 'Like'} ({interactions.likeCount})
                </Text>
              </Pressable>
              <View style={styles.commentHint}>
                <CommentIcon size={16} color="#475569" />
                <Text style={styles.commentHintText}>Comment here and get SRV Team reply</Text>
              </View>
            </View>

            {!interactionsSupported ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeTitle}>Could not sync likes or comments right now</Text>
                <Text style={styles.noticeText}>
                  Please make sure you are signed in and the server is reachable, then try again.
                </Text>
              </View>
            ) : null}

            <View style={styles.composeCard}>
              <Text style={styles.composeTitle}>Add your comment</Text>
              <TextInput
                value={commentDraft}
                onChangeText={onCommentChange}
                placeholder="Write your feedback, question or review..."
                placeholderTextColor="#94A3B8"
                multiline
                style={styles.commentInput}
                textAlignVertical="top"
              />
              <Pressable
                style={[styles.submitCommentButton, (!commentDraft.trim() || submittingComment || !interactionsSupported) ? styles.submitCommentButtonDisabled : null]}
                onPress={onSubmitComment}
                disabled={!commentDraft.trim() || submittingComment || !interactionsSupported}
              >
                <SendIcon color="#FFFFFF" />
                <Text style={styles.submitCommentText}>{submittingComment ? 'Posting...' : 'Post Comment'}</Text>
              </Pressable>
            </View>

            <View style={styles.commentsSection}>
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comments</Text>
                {interactionsLoading ? <ActivityIndicator size="small" color="#6B7C2D" /> : null}
              </View>
              {interactions.comments.length === 0 ? (
                <View style={styles.commentsEmpty}>
                  <Text style={styles.commentsEmptyTitle}>No comments yet</Text>
                  <Text style={styles.commentsEmptyText}>Be the first one to ask something or share feedback on this video.</Text>
                </View>
              ) : (
                interactions.comments.map((comment) => <CommentRow key={comment.id} comment={comment} />)
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function EmptyState({
  darkMode,
  tx,
  onNavigate,
}: {
  darkMode: boolean;
  tx: (s: string) => string;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <View style={[styles.emptyWrap, { backgroundColor: darkMode ? '#101826' : '#F4F8EE' }]}>
      <Text style={styles.emptyEmoji}>Video</Text>
      <Text style={[styles.emptyTitle, { color: darkMode ? '#F8FAFC' : '#1D2A1A' }]}>{tx('No videos yet')}</Text>
      <Text style={[styles.emptyText, { color: darkMode ? '#A9B6C6' : '#74816B' }]}>
        {tx('Videos will appear here once uploaded by SRV Team')}
      </Text>
      <Pressable onPress={() => onNavigate('categories')} style={styles.browseBtn}>
        <Text style={styles.browseBtnText}>{tx('Browse Categories')}</Text>
      </Pressable>
    </View>
  );
}

const EMPTY_INTERACTIONS: PlayInteractions = {
  playId: '',
  likeCount: 0,
  likedByMe: false,
  comments: [],
};

// ── Coming Soon Screen ────────────────────────────────────────────────────────
function ComingSoonScreen({ darkMode, insets }: { darkMode: boolean; insets: { top: number; bottom: number } }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim, floatAnim]);

  return (
    <LinearGradient
      colors={darkMode ? ['#2A1810', '#3D2418', '#4D2E1E'] : ['#FBF1E7', '#F5E8DC', '#F0DEC9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[csStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* Decorative blobs */}
      <View style={[csStyles.blob1, { backgroundColor: darkMode ? 'rgba(141,74,30,0.22)' : 'rgba(141,74,30,0.14)' }]} />
      <View style={[csStyles.blob2, { backgroundColor: darkMode ? 'rgba(106,47,18,0.20)' : 'rgba(166,93,46,0.10)' }]} />

      <View style={csStyles.content}>
        {/* Animated play icon */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }, { translateY: floatAnim }], marginBottom: 32 }}>
          <LinearGradient
            colors={['#6A2F12', '#8D4A1E', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={csStyles.iconCircle}
          >
            <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
              <Path d="M8 5.5v13l10-6.5-10-6.5z" fill="#FFFFFF" />
            </Svg>
          </LinearGradient>
        </Animated.View>

        {/* Badge */}
        <View style={[csStyles.badge, {
          backgroundColor: darkMode ? 'rgba(141,74,30,0.25)' : 'rgba(106,47,18,0.10)',
          borderColor: darkMode ? 'rgba(141,74,30,0.55)' : 'rgba(106,47,18,0.25)',
        }]}>
          <Text style={[csStyles.badgeText, { color: darkMode ? '#F5C9A0' : '#6A2F12' }]}>✦  SRV Play Zone  ✦</Text>
        </View>

        {/* Main heading */}
        <Text style={[csStyles.title, { color: darkMode ? '#FBF1E7' : '#3D2418' }]}>
          This Feature is{'\n'}
          <Text style={csStyles.titleAccent}>Coming Soon</Text>
        </Text>

        {/* Subtitle */}
        <Text style={[csStyles.subtitle, { color: darkMode ? '#F5C9A0' : '#8D4A1E' }]}>
          Stay Updated
        </Text>

        {/* Description */}
        <Text style={[csStyles.desc, { color: darkMode ? '#C4A882' : '#8A7A6E' }]}>
          We&apos;re crafting an amazing video experience for you - product guides, quick reels, and helpful tips. It&apos;ll be worth the wait!
        </Text>

        {/* Divider dots */}
        <View style={csStyles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[csStyles.dot, { backgroundColor: i === 1 ? '#6A2F12' : (darkMode ? '#5C3A28' : '#E5C9B0') }]} />
          ))}
        </View>

        {/* Info pills */}
        <View style={csStyles.pillsRow}>
          {['📹 Video Guides', '⚡ Quick Reels', '💡 Helpful Tips'].map((label) => (
            <View key={label} style={[csStyles.pill, {
              backgroundColor: darkMode ? 'rgba(141,74,30,0.20)' : 'rgba(106,47,18,0.08)',
              borderColor: darkMode ? 'rgba(141,74,30,0.40)' : 'rgba(106,47,18,0.18)',
            }]}>
              <Text style={[csStyles.pillText, { color: darkMode ? '#F5C9A0' : '#6A2F12' }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const csStyles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  blob1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -80, right: -80 },
  blob2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: 60, left: -60 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconCircle: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', shadowColor: '#6A2F12', shadowOpacity: 0.40, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 7, marginBottom: 20 },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 42, marginBottom: 8 },
  titleAccent: { color: '#6A2F12' },
  subtitle: { fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  desc: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 300, marginBottom: 28 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  pill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontSize: 12, fontWeight: '700' },
});

export function PlayScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { darkMode, tx } = usePreferenceContext();
  const { appSettings } = useAppData();
  const insets = useSafeAreaInsets();

  const [videos, setVideos] = useState<PlayVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategoryKey>('all');
  const [selectedVideo, setSelectedVideo] = useState<PlayVideo | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [interactionsMap, setInteractionsMap] = useState<Record<string, PlayInteractions>>({});
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [interactionsSupported, setInteractionsSupported] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await playsApi.getAll();
      const ordered = [...(res.data ?? [])].sort((a, b) => {
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
    fetchVideos();
  }, [fetchVideos]);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'all') return videos;
    return videos.filter((video) => normalizeVideoCategory(video.category) === selectedCategory);
  }, [selectedCategory, videos]);

  const activeInteractions = selectedVideo ? interactionsMap[selectedVideo.id] ?? { ...EMPTY_INTERACTIONS, playId: selectedVideo.id } : EMPTY_INTERACTIONS;

  const loadInteractions = useCallback(async (videoId: string) => {
    setInteractionsLoading(true);
    try {
      const response = await playsApi.getInteractions(videoId);
      setInteractionsMap((current) => ({ ...current, [videoId]: response }));
      setInteractionsSupported(true);
    } catch {
      setInteractionsSupported(false);
      setInteractionsMap((current) => ({
        ...current,
        [videoId]: current[videoId] ?? { ...EMPTY_INTERACTIONS, playId: videoId },
      }));
    } finally {
      setInteractionsLoading(false);
    }
  }, []);

  const openVideo = useCallback((video: PlayVideo) => {
    const nextVideo = { ...video, viewCount: video.viewCount + 1 };
    setVideos((current) =>
      current.map((item) => (item.id === video.id ? { ...item, viewCount: item.viewCount + 1 } : item))
    );
    setSelectedVideo(nextVideo);
    setCommentDraft('');
    playsApi.recordView(video.id).catch(() => {});
    loadInteractions(video.id);
  }, [loadInteractions]);

  const handleToggleLike = useCallback(async () => {
    if (!selectedVideo || !interactionsSupported) return;
    setLiking(true);
    try {
      const updated = await playsApi.toggleLike(selectedVideo.id);
      setInteractionsMap((current) => ({ ...current, [selectedVideo.id]: updated }));
    } catch {
      setInteractionsSupported(false);
    } finally {
      setLiking(false);
    }
  }, [interactionsSupported, selectedVideo]);

  const handleSubmitComment = useCallback(async () => {
    if (!selectedVideo || !commentDraft.trim() || !interactionsSupported) return;
    setSubmittingComment(true);
    try {
      const updated = await playsApi.addComment(selectedVideo.id, commentDraft.trim());
      setInteractionsMap((current) => ({ ...current, [selectedVideo.id]: updated }));
      setCommentDraft('');
    } catch {
      setInteractionsSupported(false);
    } finally {
      setSubmittingComment(false);
    }
  }, [commentDraft, interactionsSupported, selectedVideo]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: darkMode ? '#081018' : '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#6B7C2D" />
      </View>
    );
  }

  // Play Zone disabled from admin panel → show Coming Soon
  if (appSettings && appSettings.playEnabled === false) {
    return <ComingSoonScreen darkMode={darkMode} insets={{ top: insets.top, bottom: insets.bottom }} />;
  }

  if (videos.length === 0) {
    return <EmptyState darkMode={darkMode} tx={tx} onNavigate={onNavigate} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: darkMode ? '#081018' : '#F8FAFC', paddingTop: insets.top + 8 }]}>
      <LinearGradient
        colors={darkMode ? ['#2A1810', '#3D2418', '#4D2E1E'] : ['#FBF1E7', '#F5E8DC', '#F0DEC9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.header}>
          <View style={styles.heroBadgeRow}>
            <View style={[styles.heroBadge, darkMode ? styles.heroBadgeDark : null]}>
              <SparkIcon />
              <Text style={styles.heroBadgeText}>{tx('Fresh Picks')}</Text>
            </View>
            <Text style={[styles.headerEyebrow, darkMode ? styles.headerEyebrowDark : null]}>{tx('SRV Videos')}</Text>
          </View>
          <Text style={[styles.headerTitle, { color: darkMode ? '#F8FAFC' : '#0F172A' }]}>{tx('Play Zone')}</Text>
          <Text style={[styles.headerSubtitle, { color: darkMode ? 'rgba(255,255,255,0.78)' : '#6E5947' }]}>
            {tx('Explore smart product videos, quick reels, and simple explainers picked for everyday browsing.')}
          </Text>
          <View style={styles.heroStatsRow}>
            <View style={[styles.heroStatPill, darkMode ? styles.heroStatPillDark : null]}>
              <Text style={[styles.heroStatValue, darkMode ? styles.heroStatValueDark : null]}>{videos.length}</Text>
              <Text style={[styles.heroStatLabel, darkMode ? styles.heroStatLabelDark : null]}>{tx('videos')}</Text>
            </View>
            <View style={[styles.heroStatPill, darkMode ? styles.heroStatPillDark : null]}>
              <Text style={[styles.heroStatValue, darkMode ? styles.heroStatValueDark : null]}>{filteredVideos.length}</Text>
              <Text style={[styles.heroStatLabel, darkMode ? styles.heroStatLabelDark : null]}>{tx('visible')}</Text>
            </View>
          </View>
          <View style={styles.heroChipRow}>
            {PLAY_HERO_CHIPS.map((chip) => (
              <View key={chip} style={[styles.heroChip, darkMode ? styles.heroChipDark : null]}>
                <Text style={[styles.heroChipText, darkMode ? styles.heroChipTextDark : null]}>{tx(chip)}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersWrap}
        style={styles.filtersScroller}
      >
        {VIDEO_FILTERS.map((filter) => {
          const isActive = selectedCategory === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => setSelectedCategory(filter.id)}
              style={[
                styles.filterChip,
                isActive
                  ? { backgroundColor: '#6A2F12', borderColor: '#6A2F12' }
                  : { backgroundColor: darkMode ? '#132031' : '#FFFFFF', borderColor: darkMode ? '#233248' : '#E5D4C1' },
              ]}
            >
              <Text style={[styles.filterChipText, { color: isActive ? '#FFFFFF' : darkMode ? '#DCE4EE' : '#475569' }]}>
                {tx(filter.label)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHead}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: darkMode ? '#C4A88C' : '#8D4A1E' }]}>{tx('Now Showing')}</Text>
          <Text style={[styles.sectionTitle, { color: darkMode ? '#F8FAFC' : '#0F172A' }]}>{tx('Video Picks')}</Text>
        </View>
        <View style={[styles.sectionCountPill, darkMode ? styles.sectionCountPillDark : null]}>
          <Text style={[styles.sectionCountText, darkMode ? styles.sectionCountTextDark : null]}>{filteredVideos.length} {tx('items')}</Text>
        </View>
      </View>

      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <VideoCard video={item} onOpen={() => openVideo(item)} />}
        ListEmptyComponent={
          <View style={styles.sectionEmpty}>
            <Text style={[styles.sectionEmptyTitle, { color: darkMode ? '#F8FAFC' : '#0F172A' }]}>{tx('No videos in this category')}</Text>
            <Text style={[styles.sectionEmptyText, { color: darkMode ? '#A8B3C7' : '#64748B' }]}>
              {tx('Switch category or wait for SRV Team uploads')}
            </Text>
          </View>
        }
      />

      {selectedVideo ? (
        <VideoOverlay
          video={selectedVideo}
          insets={{ top: insets.top, bottom: insets.bottom }}
          interactions={activeInteractions}
          interactionsLoading={interactionsLoading}
          interactionsSupported={interactionsSupported}
          commentDraft={commentDraft}
          submittingComment={submittingComment}
          liking={liking}
          onClose={() => setSelectedVideo(null)}
          onCommentChange={setCommentDraft}
          onSubmitComment={handleSubmitComment}
          onToggleLike={handleToggleLike}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 4,
  },
  heroCard: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 30,
    paddingVertical: 20,
    overflow: 'hidden',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -48,
    right: -24,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -24,
    left: 12,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#6A2F12',
  },
  heroBadgeDark: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroBadgeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerEyebrow: {
    color: '#8D4A1E',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  headerEyebrowDark: { color: 'rgba(255,255,255,0.68)' },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 21,
    maxWidth: '92%',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroStatPill: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minWidth: 98,
  },
  heroStatPillDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  heroStatValue: {
    color: '#6A2F12',
    fontSize: 18,
    fontWeight: '900',
  },
  heroStatValueDark: { color: '#FFFFFF' },
  heroStatLabel: {
    color: '#8B6A52',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  heroStatLabelDark: { color: 'rgba(255,255,255,0.72)' },
  heroChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  heroChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  heroChipDark: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroChipText: {
    color: '#6A2F12',
    fontSize: 11,
    fontWeight: '800',
  },
  heroChipTextDark: {
    color: '#F8E7D6',
  },
  filtersScroller: {
    minHeight: 64,
  },
  filtersWrap: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 10,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHead: {
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sectionCountPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF4EA',
    borderWidth: 1,
    borderColor: '#F3D2B5',
  },
  sectionCountPillDark: {
    backgroundColor: '#132031',
    borderColor: '#25364E',
  },
  sectionCountText: {
    color: '#8D4A1E',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCountTextDark: {
    color: '#D7E3F0',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8D9C8',
    shadowColor: '#8D4A1E',
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  videoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
  },
  videoFrameShade: {
    ...StyleSheet.absoluteFillObject,
  },
  videoFrameMeta: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoFrameKicker: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: 'rgba(15,23,42,0.34)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  videoFrameOpen: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11.5,
    fontWeight: '700',
    backgroundColor: 'rgba(15,23,42,0.30)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewButton: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  fallbackPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#172554',
    paddingHorizontal: 20,
  },
  fallbackPreviewText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.24)',
  },
  playCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  controlOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  catBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8F1E9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6A2F12',
  },
  videoTitle: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  videoDesc: {
    marginTop: 7,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
  },
  openRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openRowText: {
    color: '#7C6250',
    fontSize: 12,
    fontWeight: '700',
  },
  openRowArrow: {
    color: '#6A2F12',
    fontSize: 11.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: '#F8E7D7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sectionEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  sectionEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionEmptyText: {
    marginTop: 6,
    fontSize: 13,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(141,74,30,0.10)',
  },
  emptyEmoji: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 270,
    marginBottom: 26,
  },
  browseBtn: {
    backgroundColor: '#6A2F12',
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: '#6A2F12',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    zIndex: 30,
  },
  overlayHero: {
    position: 'relative',
    minHeight: 420,
    justifyContent: 'space-between',
    backgroundColor: '#020617',
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayHeaderTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  overlayShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.34)',
  },
  overlayHeroTopRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
  },
  overlayHeroBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 22,
    backgroundColor: 'rgba(2, 6, 23, 0.30)',
  },
  overlayKicker: {
    color: '#A3E635',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
  },
  overlayScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  overlayScrollContent: {
    paddingBottom: 28,
    backgroundColor: '#F8FAFC',
  },
  overlayVideoFrame: {
    width: '100%',
    minHeight: 420,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  overlayBody: {
    marginTop: -16,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 18,
    minHeight: 420,
  },
  overlayStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  overlayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  overlayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  overlayStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,23,42,0.34)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overlayStatText: {
    color: '#D3DEE8',
    fontSize: 12,
    fontWeight: '700',
  },
  overlayDescription: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  likeButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  likeButtonTextActive: {
    color: '#E11D48',
  },
  commentHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  commentHintText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeBox: {
    backgroundColor: '#15222D',
    borderWidth: 1,
    borderColor: '#294154',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  noticeTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  noticeText: {
    color: '#A8B9C8',
    fontSize: 13,
    lineHeight: 19,
  },
  composeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  composeTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },
  commentInput: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
  },
  submitCommentButton: {
    marginTop: 12,
    backgroundColor: '#6B7C2D',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitCommentButtonDisabled: {
    backgroundColor: '#AAB58A',
  },
  submitCommentText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  commentsSection: {
    gap: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentsTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  commentsEmpty: {
    backgroundColor: '#EAF0F5',
    borderRadius: 18,
    padding: 18,
  },
  commentsEmptyTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  commentsEmptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  commentAuthor: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  commentMeta: {
    color: '#6B7C2D',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  commentMessage: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  commentDate: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  replyCard: {
    marginTop: 8,
    backgroundColor: '#EEF4D7',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  replyAuthor: {
    color: '#4D5C1A',
    fontSize: 12,
    fontWeight: '900',
  },
  replyMessage: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  replyDate: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
});
