import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../context/ThemeContext';

const portfolios = [
  {
    id: 1,
    name: 'Ahmed Ali',
    role: 'Frontend Developer',
    category: 'Web Development',
    skills: ['React', 'JavaScript', 'CSS'],
    bio: 'Frontend developer who enjoys building modern and responsive websites.',
  },
  {
    id: 2,
    name: 'Sarah Khan',
    role: 'UI/UX Designer',
    category: 'Design',
    skills: ['Figma', 'UI Design', 'UX'],
    bio: 'Creative designer focused on creating simple and user-friendly experiences.',
  },
  {
    id: 3,
    name: 'Mohamed Hassan',
    role: 'Data Analyst',
    category: 'Data',
    skills: ['Python', 'SQL', 'Power BI'],
    bio: 'Data analyst interested in turning data into useful business insights.',
  },
];

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = portfolios.filter((person) => {
    const matchesCategory = category === 'All' || person.category === category;
    const term = search.toLowerCase();
    const matchesSearch =
      person.name.toLowerCase().includes(term) || person.role.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  return (
    <SafeScreen scroll style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Portfolios</Text>
      <Text style={styles.subtitle}>Discover people's skills and experience.</Text>

      <TextInput
        style={styles.search}
        placeholder="Search portfolios..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {['All', 'Web Development', 'Design', 'Data'].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setCategory(item)}
            style={[
              styles.filter,
              { backgroundColor: category === item ? colors.primary : colors.input },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: category === item ? (colors.onPrimary || colors.white) : colors.text },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.grid}>
        {filtered.map((person) => (
          <View style={styles.card} key={person.id}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{person.name.charAt(0)}</Text>
            </View>

            <Text style={styles.personName}>{person.name}</Text>
            <Text style={styles.personRole}>{person.role}</Text>

            <View style={styles.skillsWrap}>
              {person.skills.map((skill) => (
                <View style={styles.skillChip} key={skill}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={() => setSelected(person)}>
              <Text style={styles.actionButtonText}>View Portfolio</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
              <Text style={styles.closeButtonText}>x</Text>
            </TouchableOpacity>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{selected?.name?.charAt(0)}</Text>
            </View>

            <Text style={styles.personName}>{selected?.name}</Text>
            <Text style={[styles.personRole, { marginBottom: 10 }]}>{selected?.role}</Text>
            <Text style={styles.bio}>{selected?.bio}</Text>

            <Text style={styles.skillsTitle}>Skills</Text>
            <View style={styles.skillsWrap}>
              {selected?.skills?.map((skill) => (
                <View style={styles.skillChip} key={skill}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Contact', `Starting contact with ${selected?.name}`)}
            >
              <Text style={styles.actionButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      marginTop: 6,
      marginBottom: 18,
      fontSize: 14,
      color: colors.textMuted,
    },
    search: {
      width: '100%',
      paddingHorizontal: 14,
      height: 50,
      borderRadius: 12,
      backgroundColor: colors.input,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    filter: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
    },
    grid: {
      gap: 14,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 18,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginBottom: 12,
    },
    avatarText: {
      color: colors.onPrimary || colors.white,
      fontSize: 24,
      fontWeight: '700',
    },
    personName: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    personRole: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 10,
    },
    skillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    skillChip: {
      borderRadius: 8,
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    skillText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    actionButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      minWidth: 130,
      alignItems: 'center',
    },
    actionButtonText: {
      color: colors.onPrimary || colors.white,
      fontWeight: '700',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(11, 18, 32, 0.55)',
      padding: 20,
      justifyContent: 'center',
    },
    modalCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 20,
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      right: 10,
      top: 8,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.input,
    },
    closeButtonText: {
      color: colors.text,
      fontSize: 20,
      lineHeight: 22,
    },
    bio: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 12,
    },
    skillsTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
    },
  });

