// src/screens/JobBoard.js
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../context/ThemeContext';

export default function JobBoard({ navigation }) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const styles = useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    setLoading(true);
    // Fetch live opportunities from Firestore
    const q = query(collection(db, 'opportunities'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((item) => item.active !== false); // Show only active listings

        setOpportunities(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching opportunities:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const results = opportunities.filter((job) =>
    (filter === 'All' || job.type === filter) &&
    `${job.title || ''} ${job.company || ''} ${job.location || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <SafeScreen scroll style={styles.page} contentContainerStyle={styles.pageContent}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.title}>← Job Board</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>Find jobs and volunteering opportunities</Text>

      {/* Filter Tabs */}
      <View style={styles.filters}>
        {['All', 'Job', 'Volunteering', 'Internship'].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setFilter(item)}
            style={[
              styles.filter,
              { backgroundColor: filter === item ? (colors.primary || '#8B5CF6') : colors.input },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === item ? (colors.onPrimary || '#fff') : colors.text },
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

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary || '#8B5CF6'} style={{ marginTop: 40 }} />
      ) : results.length === 0 ? (
        <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40 }}>
          No opportunities available right now.
        </Text>
      ) : (
        results.map((job) => (
          <View style={styles.card} key={job.id}>
            <Text style={styles.cardTitle}>{job.title}</Text>
            <Text style={styles.cardMeta}>{job.company} · {job.location}</Text>
            <Text style={styles.cardMeta}>{job.type} · {job.salary || 'Competitive'}</Text>

            <TouchableOpacity
              style={styles.apply}
              onPress={() => navigation.navigate('JobDetails', { job })}
            >
              <Text style={styles.applyText}>View Details & Apply</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </SafeScreen>
  );
}

const getStyles = (colors) => ({
  page: { flex: 1, backgroundColor: colors.bg || colors.background },
  pageContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 15, marginTop: 8, marginBottom: 20, color: colors.textMuted },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filter: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
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
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, color: colors.text },
  cardMeta: { fontSize: 14, marginBottom: 4, color: colors.textMuted },
  apply: {
    backgroundColor: colors.primary || '#8B5CF6',
    marginTop: 8,
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  applyText: { color: colors.onPrimary || '#fff', fontWeight: '600', fontSize: 13 },
});