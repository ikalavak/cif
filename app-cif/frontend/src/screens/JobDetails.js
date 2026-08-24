// src/screens/JobDetails.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../context/ThemeContext';

export default function JobDetails({ route, navigation }) {
  const { job } = route.params || {};
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [modalVisible, setModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!job) {
    return (
      <SafeScreen style={styles.page}>
        <Text style={{ color: colors.text, padding: 20 }}>No opportunity details found.</Text>
      </SafeScreen>
    );
  }

  const handleApply = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Required Fields', 'Please enter your full name and email address.');
      return;
    }

    setSubmitting(true);
    try {
      const currentUser = auth?.currentUser;
      await addDoc(collection(db, 'job_applications'), {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        applicantName: fullName.trim(),
        applicantEmail: email.trim().toLowerCase(),
        applicantPhone: phone.trim(),
        coverNote: note.trim(),
        userId: currentUser ? currentUser.uid : null,
        created_at: serverTimestamp(),
      });

      Alert.alert('Success', 'Your application has been submitted!');
      setModalVisible(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setNote('');
    } catch (err) {
      console.error('Failed to submit application:', err);
      Alert.alert('Error', 'Could not submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeScreen scroll style={styles.page} contentContainerStyle={styles.pageContent}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Text style={styles.backButton}>← Back to Opportunities</Text>
      </TouchableOpacity>

      {/* Header Info */}
      <View style={styles.headerBox}>
        <Text style={styles.badge}>{job.type || 'Opportunity'}</Text>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.company}>{job.company}</Text>
        <Text style={styles.meta}>📍 {job.location}   •   💰 {job.salary || 'Competitive'}</Text>
      </View>

      {/* Description Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About the Role</Text>
        <Text style={styles.bodyText}>
          {job.description || 'No description provided.'}
        </Text>
      </View>

      {/* Requirements Section */}
      {job.requirements ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <Text style={styles.bodyText}>{job.requirements}</Text>
        </View>
      ) : null}

      {/* Application CTA */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.primaryButtonText}>
          {job.type === 'Job' ? 'Apply for this Job' : 'Express Interest'}
        </Text>
      </TouchableOpacity>

      {/* Application Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Apply: {job.title}</Text>
            <Text style={styles.modalSub}>{job.company}</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Why are you interested? (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 12 }]}
              onPress={handleApply}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onPrimary || '#fff'} />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setModalVisible(false)}
              disabled={submitting}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const getStyles = (colors) => ({
  page: { flex: 1, backgroundColor: colors.bg || colors.background },
  pageContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  backButton: { fontSize: 16, color: colors.primary || '#8B5CF6', fontWeight: '600' },
  headerBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary || '#8B5CF6',
    color: colors.onPrimary || '#fff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  company: { fontSize: 16, color: colors.textMuted, fontWeight: '600', marginBottom: 8 },
  meta: { fontSize: 14, color: colors.textMuted },
  section: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10 },
  bodyText: { fontSize: 15, lineHeight: 22, color: colors.text },
  primaryButton: {
    backgroundColor: colors.primary || '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.onPrimary || '#fff', fontSize: 16, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalSub: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    color: colors.text,
    backgroundColor: colors.input,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  secondaryButton: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: colors.textMuted, fontWeight: '600' },
});