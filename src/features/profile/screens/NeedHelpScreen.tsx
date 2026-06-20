import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { settingsApi, supportApi } from '@/shared/api';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { formatISTDate } from '@/shared/utils/dateIST';
import { Dialog } from '@/shared/components/Dialog';

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  replies?: { sender: string; senderName: string; message: string; timestamp: string }[];
  createdAt: string;
  photoUrl?: string | null;
  photoUrls?: string[];
};

const MAX_SUPPORT_PHOTOS = 5;

export function NeedHelpPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const { submitSupportTicket } = useAppData();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'need_help');

  const [tab, setTab] = useState<'new' | 'tickets'>('new');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [supportMail, setSupportMail] = useState('info@srvelectricals.com');
  const [supportWhatsapp, setSupportWhatsapp] = useState('918837684004');
  const [submitting, setSubmitting] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const subjectOptions = [
    tx('Normal Inquiry'),
    tx('Bulk Inquiry'),
    tx('Electrician Related Inquiry'),
    tx('QR Related Inquiry'),
  ];

  const accentColor = theme.accent || C.primary;

  useEffect(() => {
    settingsApi.getAppSettings()
      .then((settings) => {
        if (settings.supportEmail) setSupportMail(settings.supportEmail);
        if (settings.whatsappNumber) setSupportWhatsapp(settings.whatsappNumber);
      })
      .catch(() => {});
  }, []);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await supportApi.getMyTickets();
      setTickets(res.data ?? []);
    } catch {
      // silent fail
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'tickets') loadTickets();
  }, [tab, loadTickets]);

  const pickPhoto = async () => {
    if (photos.length >= MAX_SUPPORT_PHOTOS) {
      setDialog({ visible: true, variant: 'info', title: tx('Photo limit reached'), message: tx('You can attach up to 5 photos.') });
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setDialog({ visible: true, variant: 'info', title: tx('Permission required'), message: tx('Please allow gallery access.') }); return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_SUPPORT_PHOTOS - photos.length,
    });
    if (!res.canceled) setPendingPhotos(res.assets.map(asset => asset.uri).slice(0, MAX_SUPPORT_PHOTOS - photos.length));
  };

  const confirmPhoto = () => {
    if (!pendingPhotos.length) return;
    setPhotos(current => [...current, ...pendingPhotos].slice(0, MAX_SUPPORT_PHOTOS));
    setPendingPhotos([]);
  };

  const cancelPhoto = () => {
    setPendingPhotos([]);
  };

  const buildSupportMessage = () =>
    `SRV ${tx('Support Request')}\n${tx('Subject')}: ${subject.trim()}\n\n${tx('Comment')}:\n${comment.trim()}`;

  const toDataUri = async (assetUri: string) => {
    if (assetUri.startsWith('data:image/')) return assetUri;
    const base64 = await LegacyFileSystem.readAsStringAsync(assetUri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  };

  const submitToSrv = async () => {
    if (!subject.trim() || !comment.trim()) {
      setDialog({ visible: true, variant: 'info', title: tx('incompleteForm'), message: tx('fillSubjectComment') }); return;
    }
    setSubmitting(true);
    try {
      const photoUrls = photos.length ? await Promise.all(photos.map(toDataUri)) : undefined;
      await submitSupportTicket({
        subject: subject.trim(),
        comment: comment.trim(),
        photoUrl: photoUrls?.[0],
        photoUrls,
      });
      setSubject('');
      setComment('');
      setPhotos([]);
      setDialog({ visible: true, variant: 'success', title: tx('Support Request'), message: tx('Your request has been submitted successfully.') });
      setTab('tickets');
    } catch {
      setDialog({ visible: true, variant: 'error', title: tx('Support Request'), message: tx('We could not submit your request right now. Please try again.') });
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsapp = async () => {
    if (!subject.trim() || !comment.trim()) {
      setDialog({ visible: true, variant: 'info', title: tx('incompleteForm'), message: tx('fillSubjectComment') }); return;
    }
    const message = encodeURIComponent(buildSupportMessage());
    const appUrl = `whatsapp://send?phone=${supportWhatsapp}&text=${message}`;
    const webUrl = `https://wa.me/${supportWhatsapp}?text=${message}`;
    const canOpenApp = await Linking.canOpenURL(appUrl);
    if (canOpenApp) {
      await Linking.openURL(appUrl);
      if (photos.length) {
        setDialog({ visible: true, variant: 'info', title: tx('Photos ready'), message: tx('WhatsApp chat has opened on the SRV number. Please attach the selected photos manually inside WhatsApp.') });
      }
      return;
    }
    const canOpenWeb = await Linking.canOpenURL(webUrl);
    if (!canOpenWeb) {
      setDialog({ visible: true, variant: 'info', title: tx('WhatsApp unavailable'), message: tx('Please install or enable WhatsApp to send your request.') }); return;
    }
    await Linking.openURL(webUrl);
    if (photos.length) {
      setDialog({ visible: true, variant: 'info', title: tx('Photos ready'), message: tx('WhatsApp chat has opened on the SRV number. Please attach the selected photos manually inside WhatsApp.') });
    }
  };

  const openMail = async () => {
    if (!subject.trim() || !comment.trim()) {
      setDialog({ visible: true, variant: 'info', title: tx('incompleteForm'), message: tx('fillSubjectComment') }); return;
    }
    try {
      await MailComposer.composeAsync({
        recipients: [supportMail],
        subject: `SRV Support: ${subject.trim()}`,
        body: buildSupportMessage(),
        attachments: photos,
      });
    } catch {
      const mailSubject = encodeURIComponent(`SRV Support: ${subject.trim()}`);
      const mailBody = encodeURIComponent(buildSupportMessage());
      const fallbackUrl = `mailto:${supportMail}?subject=${mailSubject}&body=${mailBody}`;
      const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
      if (!canOpenFallback) {
        setDialog({ visible: true, variant: 'info', title: tx('Mail unavailable'), message: tx('Please configure a mail app to send your request.') }); return;
      }
      await Linking.openURL(fallbackUrl);
    }
  };

  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message: string; confirmLabel?: string; onConfirm?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const isTicketClosed = selectedTicket?.status === 'closed' || selectedTicket?.status === 'resolved';

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || isTicketClosed) return;
    setSendingReply(true);
    try {
      await supportApi.replyToTicket(selectedTicket.id, replyText.trim());
      const newReply = { sender: 'user', senderName: 'You', message: replyText.trim(), timestamp: new Date().toISOString() };
      const updatedTicket = {
        ...selectedTicket,
        replies: [...(selectedTicket.replies || []), newReply],
        status: 'open' as string,
      };
      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setReplyText('');
    } catch {
      setDialog({ visible: true, variant: 'error', title: tx('Error'), message: tx('Could not send reply. Please try again.') });
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setClosing(true);
    try {
      await supportApi.closeTicket(selectedTicket.id);
      const updatedTicket = { ...selectedTicket, status: 'closed' };
      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setDialog({ visible: true, variant: 'success', title: tx('Ticket Closed'), message: tx('Your ticket has been closed.') });
    } catch {
      setDialog({ visible: true, variant: 'error', title: tx('Error'), message: tx('Could not close ticket. Please try again.') });
    } finally {
      setClosing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return theme.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return tx('Pending');
      case 'in_progress': return tx('In Progress');
      case 'resolved': return tx('Resolved');
      case 'closed': return tx('Closed');
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return tx('Just now');
    if (hours < 24) return `${hours}h ago`;
    return formatISTDate(date.toISOString());
  };

  if (selectedTicket) {
    const ticketPhotos = [...new Set([
      ...(selectedTicket.photoUrls ?? []),
      ...(selectedTicket.photoUrl ? [selectedTicket.photoUrl] : []),
    ].filter(Boolean))] as string[];
    const messages = [
      { type: 'user', message: selectedTicket.message, createdAt: selectedTicket.createdAt, photoUrls: ticketPhotos },
      ...(selectedTicket.replies || []).map(r => ({ type: r.sender, message: r.message, createdAt: r.timestamp, senderName: r.senderName })),
    ];

    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <PageHeader title={selectedTicket.subject} onBack={() => setSelectedTicket(null)} />
        <FlatList
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', justifyContent: item.type === 'admin' ? 'flex-end' : 'flex-start' }}>
              {item.type !== 'admin' && (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                    {(item as any).senderName && (item as any).senderName !== 'You' ? (item as any).senderName.charAt(0) : 'U'}
                  </Text>
                </View>
              )}
              <View style={{ maxWidth: '75%' }}>
                <View style={{
                  padding: 12, borderRadius: 16,
                  backgroundColor: item.type === 'admin' ? '#EDE9FE' : theme.surface,
                  borderWidth: 1,
                  borderColor: item.type === 'admin' ? '#DDD6FE' : theme.border,
                }}>
                  <Text style={{ fontSize: 13, color: theme.textPrimary, lineHeight: 19 }}>{item.message}</Text>
                  {'photoUrls' in item && item.photoUrls && item.photoUrls.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ticketPhotoStrip}>
                      {item.photoUrls.map((photo, index) => (
                        <Image key={`${photo}-${index}`} source={{ uri: photo }} style={styles.ticketPhoto} />
                      ))}
                    </ScrollView>
                  ) : null}
                </View>
                <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, textAlign: item.type === 'admin' ? 'right' : 'left' }}>
                  {formatDate(item.createdAt as string)}
                </Text>
              </View>
              {item.type === 'admin' && (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>A</Text>
                </View>
              )}
            </View>
          )}
        />

        {/* Chat Input + Close Button */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={{
                flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: theme.border,
                backgroundColor: theme.soft, color: theme.textPrimary, paddingHorizontal: 14, fontSize: 13,
              }}
              placeholder={isTicketClosed ? tx('This ticket is closed') : tx('Type a message...')}
              placeholderTextColor={theme.textMuted}
              value={replyText}
              onChangeText={setReplyText}
              editable={!isTicketClosed}
              multiline
            />
            <TouchableOpacity
              style={{
                width: 44, height: 44, borderRadius: 12, backgroundColor: isTicketClosed || !replyText.trim() ? theme.border : accentColor,
                alignItems: 'center', justifyContent: 'center',
              }}
              onPress={() => void handleSendReply()}
              disabled={isTicketClosed || !replyText.trim() || sendingReply}
              activeOpacity={0.8}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <AppIcon name="mail" size={18} color={isTicketClosed || !replyText.trim() ? theme.textMuted : '#fff'} />
              )}
            </TouchableOpacity>
          </View>
          {!isTicketClosed && (
            <TouchableOpacity
              style={{ alignSelf: 'center', marginTop: 8 }}
              onPress={() => {
                setDialog({
                  visible: true, variant: 'destructive', title: tx('Close Ticket'), message: tx('Are you sure you want to close this ticket?'),
                  confirmLabel: tx('Close'),
                  onConfirm: () => void handleCloseTicket(),
                });
              }}
              disabled={closing}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>
                {closing ? tx('Closing...') : tx('Close Ticket')}
              </Text>
            </TouchableOpacity>
          )}
          {isTicketClosed && (
            <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', marginTop: 6 }}>
              {getStatusLabel(selectedTicket.status)} - {tx('You cannot send more messages')}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('needHelp')} onBack={onBack} />

      {/* Tab Switcher */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: 12, backgroundColor: theme.soft, padding: 3 }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: tab === 'new' ? accentColor : 'transparent', alignItems: 'center' }}
          onPress={() => setTab('new')}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'new' ? '#fff' : theme.textMuted }}>
            {tx('New Request')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: tab === 'tickets' ? accentColor : 'transparent', alignItems: 'center' }}
          onPress={() => setTab('tickets')}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'tickets' ? '#fff' : theme.textMuted }}>
            {tx('My Tickets')}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'new' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.headerRow}>
              <View style={styles.iconWrap}>
                <AppIcon name="support" size={24} color={C.teal} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {pageContent.cardTitle || tx('Support Request')}
                </Text>
                <Text style={[styles.sub, { color: theme.textMuted }]}>
                  {pageContent.cardSubtitle || tx('We typically respond within 24 hours')}
                </Text>
              </View>
            </View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('Subject')}</Text>
            <TouchableOpacity
              style={[styles.input, styles.dropdownTrigger, { backgroundColor: theme.soft, borderColor: theme.border }]}
              onPress={() => setShowSubjectDropdown(true)}
              activeOpacity={0.85}
            >
              <Text style={[styles.dropdownValue, { color: subject ? theme.textPrimary : theme.textMuted }]} numberOfLines={1}>
                {subject || tx('Select subject')}
              </Text>
              <AppIcon name="chevronDown" size={18} color={theme.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('Comment')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.soft, borderColor: theme.border, color: theme.textPrimary, height: 110, textAlignVertical: 'top', paddingTop: 14 }]}
              placeholder={tx('Describe your issue in detail...')}
              placeholderTextColor={theme.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <Text style={[styles.photoCount, { color: theme.textMuted }]}>{tx('Photos')} ({photos.length}/{MAX_SUPPORT_PHOTOS})</Text>
            <Text style={[styles.photoHint, { color: theme.textMuted }]}>{tx('Tap + to select and attach multiple photos')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
              {photos.map((photo, index) => (
                <View key={`${photo}-${index}`} style={[styles.photoTile, { borderColor: theme.border }]}>
                  <Image source={{ uri: photo }} style={styles.previewImage} />
                  <TouchableOpacity onPress={() => setPhotos(current => current.filter((_, itemIndex) => itemIndex !== index))} style={styles.removePhotoButton} accessibilityLabel={tx('Remove photo')}>
                    <Text style={styles.removePhotoText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_SUPPORT_PHOTOS && (
                <TouchableOpacity
                  style={[styles.addPhotoButton, { backgroundColor: theme.soft, borderColor: theme.border }]}
                  onPress={pickPhoto}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={tx('Add multiple photos')}
                >
                  <Text style={[styles.addPhotoPlus, { color: accentColor }]}>+</Text>
                  <Text style={[styles.addPhotoLabel, { color: theme.textMuted }]}>{photos.length ? tx('Add more') : tx('Upload Photos')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: accentColor }, submitting && { opacity: 0.7 }]}
            onPress={() => void submitToSrv()}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>
              {submitting ? tx('Submitting...') : pageContent.primaryCtaLabel || tx('Submit Request')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: theme.textMuted }]}>
            {pageContent.helperText || tx('This saves your issue in the SRV system so SRV Team can track and resolve it.')}
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity onPress={() => void openWhatsapp()} activeOpacity={0.9}>
              <LinearGradient colors={['#E8FFF1', '#C6F3D8', '#E0F2FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtn}>
                <View style={[styles.actionIconWrap, styles.whatsappIconWrap]}>
                  <AppIcon name="whatsapp" size={18} color="#16A34A" />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{tx('Send to WhatsApp')}</Text>
                  <Text style={styles.actionSub}>{pageContent.supportText || tx('Open SRV support chat')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void openMail()} activeOpacity={0.9}>
              <LinearGradient colors={['#FFF4EE', '#FFE1D6', '#FDE7F3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtn}>
                <View style={[styles.actionIconWrap, styles.mailIconWrap]}>
                  <AppIcon name="mail" size={18} color={C.primary} />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{tx('Send to Mail')}</Text>
                  <Text style={styles.actionSub}>{tx('Send to')} {supportMail}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16 }}>
          {loadingTickets ? (
            <ActivityIndicator size="large" color={accentColor} style={{ marginTop: 40 }} />
          ) : tickets.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <AppIcon name="support" size={48} color={C.muted} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textMuted, marginTop: 12 }}>
                {tx('No tickets yet')}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                {tx('Create a new request to get help')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.ticketCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setSelectedTicket(item)}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary, flex: 1 }} numberOfLines={1}>
                      {item.subject}
                    </Text>
                    <View style={{ backgroundColor: getStatusColor(item.status) + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: getStatusColor(item.status) }}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>
                      {formatDate(item.createdAt)}
                    </Text>
                    {item.replies && item.replies.length > 0 && (
                      <Text style={{ fontSize: 10, color: '#7C3AED' }}>
                        {item.replies.length} {tx('replies')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      <Modal visible={showSubjectDropdown} animationType="fade" transparent onRequestClose={() => setShowSubjectDropdown(false)}>
        <Pressable style={styles.dropdownOverlay} onPress={() => setShowSubjectDropdown(false)}>
          <View style={[styles.dropdownSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.dropdownTitle, { color: theme.textPrimary }]}>{tx('Select Subject')}</Text>
            {subjectOptions.map((option, index) => (
              <TouchableOpacity
                key={option}
                style={[styles.dropdownItem, index < subjectOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                onPress={() => { setSubject(option); setShowSubjectDropdown(false); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.dropdownItemText, { color: theme.textPrimary }]}>{option}</Text>
                {subject === option ? <AppIcon name="check" size={16} color={accentColor} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={pendingPhotos.length > 0} animationType="fade" transparent onRequestClose={cancelPhoto}>
        <View style={styles.dropdownOverlay}>
          <View style={[styles.dropdownSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.confirmPreviewStrip}>
              {pendingPhotos.map((photo, index) => (
                <Image key={`${photo}-${index}`} source={{ uri: photo }} style={styles.confirmPreview} />
              ))}
            </ScrollView>
            <Text style={[styles.dropdownTitle, { color: theme.textPrimary }]}>{tx('Add selected photos?')} ({pendingPhotos.length})</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={cancelPhoto} activeOpacity={0.85}>
                <Text style={styles.confirmCancelText}>{tx('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDoneBtn, { backgroundColor: accentColor }]} onPress={confirmPhoto} activeOpacity={0.85}>
                <Text style={styles.confirmDoneText}>{tx('Done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        onConfirm={dialog.onConfirm}
        onClose={closeDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  card: { borderRadius: 28, padding: 20, borderWidth: 1, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: C.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '900' },
  sub: { fontSize: 11, marginTop: 2 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownValue: { flex: 1, fontSize: 14, fontWeight: '500', marginRight: 12 },
  uploadBox: {
    height: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadText: { fontSize: 14, color: C.muted, fontWeight: '600' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoCount: { fontSize: 12, fontWeight: '700', marginBottom: -4 },
  photoHint: { fontSize: 11, lineHeight: 16, marginTop: -8 },
  photoStrip: { gap: 10, paddingBottom: 2 },
  photoTile: { width: 92, height: 92, borderRadius: 12, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  removePhotoButton: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.78)', alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#FFFFFF', fontSize: 18, lineHeight: 20, fontWeight: '700' },
  addPhotoButton: { width: 92, height: 92, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 6 },
  addPhotoPlus: { fontSize: 30, lineHeight: 32, fontWeight: '500' },
  addPhotoLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,17,32,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdownSheet: { borderRadius: 24, borderWidth: 1, padding: 20 },
  dropdownTitle: { fontSize: 17, fontWeight: '900', marginBottom: 12 },
  dropdownItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  dropdownItemText: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 12 },
  confirmPreview: {
    width: 150,
    height: 150,
    borderRadius: 16,
  },
  confirmPreviewStrip: { gap: 10, paddingBottom: 16 },
  ticketPhotoStrip: { gap: 8, paddingTop: 10 },
  ticketPhoto: { width: 118, height: 118, borderRadius: 12, resizeMode: 'cover' },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  confirmCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: { fontSize: 15, fontWeight: '700', color: C.dark },
  confirmDoneBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDoneText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  primaryAction: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  helperText: { fontSize: 12, lineHeight: 18, marginTop: -2 },
  actionGrid: { gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  mailIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  actionCopy: { flex: 1 },
  actionTitle: { color: '#152238', fontSize: 15, fontWeight: '800' },
  actionSub: { color: '#6B7A93', fontSize: 11.5, marginTop: 3, lineHeight: 16 },
  ticketCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
});
