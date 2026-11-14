import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge, mapReviewStatusToVariant } from '@/components/common/status-badge';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { ReviewCommentStatus } from '@/types/review';

export default function ReviewDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { session } = useAuth();
  const {
    reviews,
    uploadReviewVersion,
    sendToClient,
    resolveComment,
    reopenReview,
  } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playingVoiceCommentId, setPlayingVoiceCommentId] = useState<string | null>(null);

  const review = reviews.find(r => r.id === itemId);

  if (!review) {
    return (
      <ScreenWrapper>
        <StateView
          type="error"
          title="Review Item Not Found"
          message="The requested review deliverable could not be found."
          actionTitle="Back"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  // Permission check: Admin/Owner or assigned editor only
  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');
  const isAssignedEditor = session?.id === review.assignedEditorId;

  if (!isOwnerOrAdmin && !isAssignedEditor) {
    return (
      <ScreenWrapper>
        <StateView
          type="permission-denied"
          title="Review Restricted"
          message="Staff media review is restricted to studio admins and the explicitly assigned editor."
          actionTitle="Back"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  // Pro feature check (REV-01)
  if (!review.isProEnabled) {
    return (
      <ScreenWrapper>
        <View style={[styles.proLockedCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, margin: spacing.lg }]}>
          <Ionicons name="lock-closed" size={32} color={colors.gold} />
          <Text style={[typography.title2, { color: colors.textPrimary, marginTop: spacing.sm }]}>
            WedTrack Pro Required
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
            Client interactive album proofing and video review workflows require the studio Pro feature entitlement.
          </Text>
          <Button
            title="Inspect Studio Pro Status"
            onPress={() => router.push('/billing')}
            size="md"
            variant="primary"
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </ScreenWrapper>
    );
  }

  // Handle Pick & Upload (REV-02)
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: review.reviewType === 'ALBUM' ? ['application/pdf'] : ['video/mp4'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        setIsUploading(true);
        setUploadProgress(10);

        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              setIsUploading(false);
              uploadReviewVersion(review.id, {
                fileName: file.name,
                fileSizeBytes: file.size || 50000000,
                pageCount: review.reviewType === 'ALBUM' ? 40 : undefined,
                durationSeconds: review.reviewType !== 'ALBUM' ? 1800 : undefined,
              });
              Alert.alert('Upload Complete', `Version ${review.versions.length + 1} has been uploaded and verified.`);
              return 100;
            }
            return prev + 25;
          });
        }, 300);
      }
    } catch (e) {
      console.warn('Doc picker error:', e);
    }
  };

  // Send to Client (REV-03)
  const handleSendToClient = () => {
    const res = sendToClient(review.id);
    if (res.success) {
      Alert.alert('Sent to Client', 'Current version has been published to the client web portal.');
    } else {
      Alert.alert('Cannot Publish', res.error || 'Unable to publish review version.');
    }
  };

  // Reopen Review (REV-05)
  const handleReopen = () => {
    Alert.alert('Reopen Review', 'Reopen this approved deliverable for another round of changes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reopen Review',
        onPress: () => reopenReview(review.id),
      },
    ]);
  };

  const handleToggleVoice = (commentId: string) => {
    if (playingVoiceCommentId === commentId) {
      setPlayingVoiceCommentId(null);
    } else {
      setPlayingVoiceCommentId(commentId);
      setTimeout(() => setPlayingVoiceCommentId(null), 4000); // simulate 4s audio clip playback
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header Review Status */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg },
          ]}
        >
          <View style={styles.topRow}>
            <Text style={[typography.caption2, { color: colors.textMuted }]}>{review.tenantOrderNumber}</Text>
            <StatusBadge label={review.status} variant={mapReviewStatusToVariant(review.status)} />
          </View>

          <Text style={[typography.title1, { color: colors.textPrimary, marginTop: 4 }]}>
            {review.title}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {review.orderTitle} · Round {review.currentRound}
          </Text>

          <View style={[styles.metaRow, { marginTop: spacing.md }]}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>
              Assigned Editor: {review.assignedEditorName}
            </Text>
            <Text style={[typography.caption1, { color: colors.textMuted, marginHorizontal: 6 }]}>•</Text>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>
              Recipient: {review.clientEmail || 'Client Portal'}
            </Text>
          </View>

          {/* Action Row */}
          <View style={[styles.actionRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.sm }]}>
            {review.status !== 'APPROVED' ? (
              <Button
                title="Send to Client Portal"
                onPress={handleSendToClient}
                size="sm"
                variant="primary"
              />
            ) : (
              <Button
                title="Reopen Review"
                onPress={handleReopen}
                size="sm"
                variant="outline"
              />
            )}

            <Button
              title="+ Upload Revision"
              onPress={handlePickDocument}
              size="sm"
              variant="outline"
              style={{ marginLeft: 8 }}
            />
          </View>

          {/* Upload Progress Bar if active */}
          {isUploading && (
            <View style={{ marginTop: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[typography.caption1, { color: colors.primary }]}>Uploading Revision Media...</Text>
                <Text style={[typography.caption1, { color: colors.primary, fontWeight: '700' }]}>{uploadProgress}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${uploadProgress}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Current Version Card */}
        {review.currentVersion && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
            ]}
          >
            <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              Current Version #{review.currentVersion.versionNumber} (Verified)
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary }]}>
              File: {review.currentVersion.fileName} ({(review.currentVersion.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB)
            </Text>
            {review.currentVersion.pageCount && (
              <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                Spreads: {review.currentVersion.pageCount} Pages
              </Text>
            )}
            {review.currentVersion.durationSeconds && (
              <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                Duration: {Math.floor(review.currentVersion.durationSeconds / 60)} minutes
              </Text>
            )}
          </View>
        )}

        {/* Client Feedback Comments (REV-04) */}
        <Text style={[typography.title2, { color: colors.textPrimary, marginTop: spacing.xl }]}>
          Client Feedback & Pins ({review.comments.length})
        </Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm }]}>
          Review pin markers, text changes and voice notes submitted from client web portal
        </Text>

        {review.comments.length === 0 ? (
          <StateView type="empty" title="No Open Comments" message="The client has not requested any revisions on this round." />
        ) : (
          review.comments.map(c => {
            const isVoicePlaying = playingVoiceCommentId === c.id;
            return (
              <View
                key={c.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: c.status === 'OPEN' ? colors.warning : colors.border,
                    borderRadius: radii.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={styles.topRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={c.pinPosition ? 'pin' : c.voiceNoteUrl ? 'mic' : 'chatbubble-ellipses'}
                      size={16}
                      color={c.status === 'OPEN' ? colors.warning : colors.success}
                    />
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>{c.authorName}</Text>
                  </View>
                  <StatusBadge
                    label={c.status}
                    variant={c.status === 'OPEN' ? 'warning' : 'success'}
                    size="sm"
                  />
                </View>

                {/* Pin position coordinates */}
                {c.pinPosition && (
                  <Text style={[typography.caption2, { color: colors.gold, fontWeight: '700', marginTop: 4 }]}>
                    PINNED AT: SPREAD {c.pinPosition.pageNumber || 1} (X: {c.pinPosition.x}%, Y: {c.pinPosition.y}%)
                  </Text>
                )}

                <Text style={[typography.body, { color: colors.textPrimary, marginTop: 4 }]}>
                  {c.text}
                </Text>

                {/* Voice Note Player simulation */}
                {c.voiceNoteUrl && (
                  <TouchableOpacity
                    onPress={() => handleToggleVoice(c.id)}
                    style={[
                      styles.voicePlayer,
                      {
                        backgroundColor: isVoicePlaying ? colors.goldSubtle : colors.surfaceSubtle,
                        borderColor: isVoicePlaying ? colors.gold : colors.border,
                        borderRadius: radii.sm,
                        marginTop: spacing.sm,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isVoicePlaying ? 'pause' : 'play'}
                      size={20}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[typography.caption1, { color: colors.textPrimary, fontWeight: '600' }]}>
                        {isVoicePlaying ? 'Playing Client Voice Note...' : 'Listen to Client Voice Feedback'}
                      </Text>
                      <Text style={[typography.caption2, { color: colors.textMuted }]}>
                        Duration: {c.voiceNoteDurationSeconds || 15}s
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Staff Resolution Note */}
                {c.staffResolutionNote && (
                  <View style={[styles.resolutionBox, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.xs, marginTop: spacing.sm }]}>
                    <Text style={[typography.caption2, { color: colors.textSecondary, fontWeight: '700' }]}>
                      EDITOR RESOLUTION NOTE:
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textPrimary, marginTop: 2 }]}>
                      {c.staffResolutionNote}
                    </Text>
                  </View>
                )}

                {/* Mark Fixed / Not Fixed */}
                {c.status === 'OPEN' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.sm }}>
                    <Button
                      title="Mark Fixed"
                      onPress={() => resolveComment(review.id, c.id, 'Resolved in revision build', 'FIXED')}
                      size="sm"
                      variant="primary"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Not Fixed"
                      onPress={() => resolveComment(review.id, c.id, 'Clarification requested from couple', 'NOT_FIXED')}
                      size="sm"
                      variant="outline"
                      style={{ flex: 1 }}
                    />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  proLockedCard: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  voicePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
  },
  resolutionBox: {
    padding: 8,
  },
});
