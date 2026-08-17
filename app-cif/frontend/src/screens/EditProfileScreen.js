import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import SafeScreen from '../components/SafeScreen';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import {
  auth,
} from '../config/firebase';

import {
  updateProfile,
  sendEmailVerification,
  updatePassword,
  updateEmail,
  reload,
} from 'firebase/auth';

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();

  const user = auth.currentUser;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [verificationSent, setVerificationSent] = useState(false);
  const [saving, setSaving] = useState(false);

  // Send verification email
  const handleVerification = async () => {
    try {
      await sendEmailVerification(user);

      setVerificationSent(true);

      Alert.alert(
        'Verification Email Sent',
        'Please check your email and click the verification link. Once verified, return to this page and save your changes.'
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Check email verification
  const checkVerification = async () => {
    try {
      await reload(user);

      if (!auth.currentUser.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email using the verification link we sent you.'
        );

        return false;
      }

      return true;
    } catch (error) {
      Alert.alert('Error', error.message);
      return false;
    }
  };

  // Save changes
  const saveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (!verificationSent && !user.emailVerified) {
      Alert.alert(
        'Verify Your Email',
        'Please send and complete email verification before saving your profile.'
      );
      return;
    }

    // Check password
    if (password || confirmPassword) {
      if (password.length < 6) {
        Alert.alert(
          'Invalid Password',
          'Password must be at least 6 characters.'
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          'Passwords Do Not Match',
          'Please make sure both passwords are the same.'
        );
        return;
      }
    }

    const verified = await checkVerification();

    if (!verified) {
      return;
    }

    try {
      setSaving(true);

      // Update first and last name
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      // Update email if it has changed
      const newEmail = email.trim();
      
      if (newEmail && newEmail !== user.email) {
        await updateEmail(user, newEmail);
         // Send verification email to the new address
         await sendEmailVerification(user);
        }

      // Update password if entered
      if (password) {
        await updatePassword(user, password);
      }

      Alert.alert(
        'Profile Updated',
        'Your profile has been successfully updated.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Update Failed',
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeScreen
      scroll
      style={[
        styles.screen,
        { backgroundColor: colors.bg },
      ]}
      contentContainerStyle={{
        paddingBottom: 30,
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.card },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          Edit Profile
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>

        {/* First Name */}
        <Text
          style={[
            styles.label,
            { color: colors.text },
          ]}
        >
          First Name
        </Text>

        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        {/* Last Name */}
        <Text
          style={[
            styles.label,
            { color: colors.text },
          ]}
        >
          Last Name
        </Text>

        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        {/* Email */}
<Text
  style={[
    styles.label,
    { color: colors.text },
  ]}
>
  Email Address
</Text>

<TextInput
  value={email}
  onChangeText={setEmail}
  placeholder="Enter email address"
  placeholderTextColor={colors.textMuted}
  keyboardType="email-address"
  autoCapitalize="none"
  style={[
    styles.input,
    {
      backgroundColor: colors.card,
      color: colors.text,
      borderColor: colors.border,
    },
  ]}
/>

        {/* Password */}
        <Text
          style={[
            styles.label,
            { color: colors.text },
          ]}
        >
          New Password
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        {/* Confirm Password */}
        <Text
          style={[
            styles.label,
            { color: colors.text },
          ]}
        >
          Confirm Password
        </Text>

        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        {/* Verification Status */}
        <View
          style={[
            styles.verificationBox,
            { backgroundColor: colors.card },
          ]}
        >
          <Feather
            name={
              user?.emailVerified
                ? 'check-circle'
                : 'alert-circle'
            }
            size={20}
            color={
              user?.emailVerified
                ? colors.primary
                : colors.error
            }
          />

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.verificationTitle,
                { color: colors.text },
              ]}
            >
              {user?.emailVerified
                ? 'Email Verified'
                : 'Email Not Verified'}
            </Text>

            <Text
              style={[
                styles.verificationText,
                { color: colors.textMuted },
              ]}
            >
              {user?.emailVerified
                ? 'Your email address has been verified.'
                : 'You need to verify your email before saving changes.'}
            </Text>
          </View>
        </View>

        {/* Send Verification Email */}
        {!user?.emailVerified && (
          <TouchableOpacity
            style={[
              styles.verifyButton,
              { backgroundColor: colors.accent },
            ]}
            onPress={handleVerification}
          >
            <Feather
              name="mail"
              size={18}
              color="#fff"
            />

            <Text style={styles.buttonText}>
              Send Verification Email
            </Text>
          </TouchableOpacity>
        )}

        {/* Save Changes */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              opacity: saving ? 0.6 : 1,
            },
          ]}
          onPress={saveProfile}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving
              ? 'Saving...'
              : 'Save Changes'}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  container: {
    paddingHorizontal: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
  },

  verificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
  },

  verificationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },

  verificationText: {
    fontSize: 13,
  },

  verifyButton: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
  },

  saveButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});