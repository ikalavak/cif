import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../context/ThemeContext';

const listings = [
  {
    id: 1,
    title: "Junior Web Developer",
    company: "Tech Solutions",
    location: "London",
    type: "Job",
    salary: "£30,000",
  },
  {
    id: 2,
    title: "Data Analyst",
    company: "Data Insights",
    location: "Manchester",
    type: "Job",
    salary: "£35,000",
  },
  {
    id: 3,
    title: "Community Volunteer",
    company: "Community Connect",
    location: "London",
    type: "Volunteering",
    salary: "Unpaid",
  },
  {
    id: 4,
    title: "Youth Sports Volunteer",
    company: "Active Youth",
    location: "Birmingham",
    type: "Volunteering",
    salary: "Unpaid",
  },
];

export default function JobBoard() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [apply, setApply] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const styles = useMemo(() => getStyles(colors), [colors]);

  const results = listings.filter((job) =>
    (filter === 'All' || job.type === filter) &&
    (job.title + job.company + job.location)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const submitApplication = () => {
    Alert.alert('Success', 'Application submitted!');
    setApply(null);
    setFullName('');
    setEmail('');
    setReason('');
  };

  return (
    <SafeScreen scroll style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.title}>Job Board</Text>
      <Text style={styles.subtitle}>Find jobs and volunteering opportunities</Text>

      <View style={styles.filters}>
        {['All', 'Job', 'Volunteering'].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setFilter(item)}
            style={[
              styles.filter,
              {
                backgroundColor: filter === item ? colors.primary : colors.input,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter === item ? (colors.onPrimary || colors.white) : colors.text,
                },
              ]}
            >
              {item === 'Job' ? 'Jobs' : item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search jobs..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {results.map((job) => (
        <View style={styles.card} key={job.id}>
          <Text style={styles.cardTitle}>{job.title}</Text>
          <Text style={styles.cardMeta}>{job.company} · {job.location}</Text>
          <Text style={styles.cardMeta}>{job.type} · {job.salary}</Text>

          <TouchableOpacity style={styles.apply} onPress={() => setApply(job)}>
            <Text style={styles.applyText}>
              {job.type === 'Job' ? 'Apply Now' : 'Apply to Volunteer'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={Boolean(apply)} transparent animationType="fade" onRequestClose={() => setApply(null)}>
        <View style={styles.modal}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>Apply for {apply?.title}</Text>

            <TextInput
              placeholder="Full name"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              placeholder="Why are you interested?"
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
            />

            <TouchableOpacity style={styles.apply} onPress={submitApplication}>
              <Text style={styles.applyText}>Submit Application</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setApply(null)} style={styles.close}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const getStyles = (colors) => ({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },

  subtitle: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 20,
    color: colors.textMuted,
  },

  filters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  filter: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },

  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },

  search: {
    width: '100%',
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.input,
    color: colors.text,
  },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.text,
  },

  cardMeta: {
    fontSize: 14,
    marginBottom: 6,
    color: colors.textMuted,
  },

  apply: {
    backgroundColor: colors.primary,
    marginTop: 8,
    alignSelf: 'flex-start',
    minWidth: 160,
    alignItems: 'center',
    color: colors.onPrimary || colors.white,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
  },

  applyText: {
    color: colors.onPrimary || colors.white,
    fontWeight: '600',
  },

  modal: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  form: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
  },

  formTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },

  input: {
    width: '100%',
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.input,
    color: colors.text,
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  close: {
    marginTop: 12,
    paddingVertical: 10,
    width: '100%',
    borderRadius: 6,
    backgroundColor: colors.input,
    alignItems: 'center',
  },

  closeText: {
    color: colors.text,
    fontWeight: '600',
  },
});

