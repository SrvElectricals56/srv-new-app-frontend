import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { profileApi } from '@/shared/api';
import { resolveImageUrl } from '@/shared/api/config';
import { Dialog, Choice } from '@/shared/components/Dialog';
import { prepareKycUpload } from '../lib/kycUpload';

type DocumentType = 'aadhar-front' | 'pan' | 'gst';

interface DocumentUploadProps {
  label: string;
  documentType: DocumentType;
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  theme: any;
  roleColor: string;
  roleSoft: string;
}

export function DocumentUpload({
  label,
  documentType,
  currentUrl,
  onUploadSuccess,
  theme,
  roleColor,
  roleSoft,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(currentUrl || null);
  const [isPdf, setIsPdf] = useState(Boolean(currentUrl && /\.pdf(?:[?#]|$)/i.test(currentUrl)));
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void; choices?: Choice[]; cancelButton?: boolean }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const pickerAspect: [number, number] = documentType === 'aadhar-front' ? [4, 3] : [3, 2];
  const previewUri = localUri && (/^https?:\/\//i.test(localUri) || localUri.startsWith('/uploads/'))
    ? resolveImageUrl(localUri)
    : localUri;

  useEffect(() => {
    setLocalUri(currentUrl || null);
    setIsPdf(Boolean(currentUrl && /\.pdf(?:[?#]|$)/i.test(currentUrl)));
  }, [currentUrl]);

  const pickDocument = async () => {
    try {
      setDialog({ visible: true, variant: 'info', title: 'Choose Source', message: 'Select document source', choices: [{ label: 'Camera', icon: 'camera', onPress: pickFromCamera }, { label: 'Gallery', icon: 'image', onPress: pickFromGallery }, { label: 'File', icon: 'file', onPress: pickFromFiles }] });
    } catch {
      setDialog({ visible: true, variant: 'error', title: 'Error', message: 'Failed to pick document' });
    }
  };

  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setDialog({ visible: true, variant: 'info', title: 'Permission needed', message: 'Allow camera access to upload documents.' });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: pickerAspect,
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        await uploadDocument({ uri: asset.uri, mimeType: asset.mimeType, name: asset.fileName, size: asset.fileSize });
      }
    } catch (error: any) {
      setDialog({ visible: true, variant: 'error', title: 'Camera unavailable', message: error?.message || 'Could not open the camera. Please try again.' });
    }
  };

  const pickFromGallery = async () => {
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setDialog({ visible: true, variant: 'info', title: 'Permission needed', message: 'Allow photo access to choose a document from your gallery.' });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        // Compatible mode converts iCloud/HEIC assets into a locally readable
        // representation before the Expo FileSystem upload starts.
        allowsEditing: false,
        quality: 0.9,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        await uploadDocument({ uri: asset.uri, mimeType: asset.mimeType, name: asset.fileName, size: asset.fileSize });
      }
    } catch (error: any) {
      setDialog({ visible: true, variant: 'error', title: 'Gallery unavailable', message: error?.message || 'Could not open the photo gallery. Please try again.' });
    }
  };

  const pickFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // Let Android/iOS document providers show files whose MIME type is
        // missing or incorrectly reported. The app and backend validate the
        // actual bytes after selection.
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      await uploadDocument({ uri: file.uri, mimeType: file.mimeType, name: file.name, size: file.size });
    } catch {
      setDialog({ visible: true, variant: 'error', title: 'Error', message: 'Failed to pick file' });
    }
  };

  const uploadDocument = async (file: Parameters<typeof prepareKycUpload>[0]) => {
    try {
      setUploading(true);
      const prepared = await prepareKycUpload(file, documentType);
      setLocalUri(prepared.uri);
      setIsPdf(prepared.type === 'application/pdf');
      const url = await profileApi.uploadDocument(prepared, documentType);
      onUploadSuccess(url);
      setDialog({ visible: true, variant: 'success', title: 'Success', message: 'Document uploaded successfully' });
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      setDialog({ visible: true, variant: 'error', title: 'Upload Failed', message: msg });
      setLocalUri(currentUrl || null);
      setIsPdf(Boolean(currentUrl && /\.pdf(?:[?#]|$)/i.test(currentUrl)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <TouchableOpacity
        onPress={pickDocument}
        disabled={uploading}
        activeOpacity={0.8}
        style={[
          styles.uploadBox,
          localUri ? styles.uploadBoxFilled : null,
          { backgroundColor: theme.soft, borderColor: theme.border },
        ]}
      >
        {uploading ? (
          <View style={styles.uploadInner}>
            <ActivityIndicator size="small" color={roleColor} />
            <Text style={[styles.uploadText, { color: theme.textMuted }]}>Uploading...</Text>
          </View>
        ) : localUri ? (
          <View style={styles.previewContainer}>
            {isPdf || /\.pdf(?:[?#]|$)/i.test(localUri) ? (
              <View style={[styles.pdfIcon, { backgroundColor: roleSoft }]}>
                <Text style={[styles.pdfText, { color: roleColor }]}>PDF</Text>
              </View>
            ) : (
              <Image source={{ uri: previewUri || localUri }} style={styles.previewImage} />
            )}
            <Text style={[styles.uploadedText, { color: theme.textPrimary }]}>
              Tap to change
            </Text>
          </View>
        ) : (
          <View style={styles.uploadInner}>
            <View style={[styles.uploadIcon, { backgroundColor: roleSoft }]}>
              <Text style={[styles.uploadIconText, { color: roleColor }]}>📄</Text>
            </View>
            <View style={styles.uploadCopy}>
              <Text style={[styles.uploadTitle, { color: theme.textPrimary }]}>
                Tap to upload
              </Text>
              <Text style={[styles.uploadText, { color: theme.textMuted }]}>
                Choose from camera, gallery, or files
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} choices={dialog.choices} cancelButton={dialog.cancelButton} onClose={closeDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uploadBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBoxFilled: {
    borderStyle: 'solid',
  },
  uploadInner: {
    alignItems: 'center',
    gap: 12,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIconText: {
    fontSize: 24,
  },
  uploadCopy: {
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 12,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  pdfIcon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfText: {
    fontSize: 18,
    fontWeight: '800',
  },
  uploadedText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
