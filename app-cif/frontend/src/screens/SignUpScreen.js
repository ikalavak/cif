import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Import Firebase dependencies
import { auth } from '../config/firebase'; // Adjust path if needed
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const { colors } = useTheme();

  const handleRegister = async () => {
    // 1. Validate all fields are filled
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // 2. Validate password length (Firebase requires 6+ characters)
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // 3. Create the user in Firebase
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Note: Firebase auth only handles email/password. 
      // You can save the 'name' to a Firestore database later if needed.

      // 4. Success! Navigate to the main app
      navigation.replace('MainApp'); 
      
    } catch (error) {
      // 5. Handle Firebase errors gracefully
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Registration Failed", "That email address is already in use.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Error", "Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Error", "Password is too weak.");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Removed the "scroll" prop and scrollContent style to enforce single-page
    <SafeScreen style={[styles.rootContainer, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
          
          <View style={styles.header}>
            <Text style={[styles.titleText, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitleText, { color: colors.textMuted }]}>Join the Creative Industries Festival</Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]} // Added dynamic text color
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]} // Added dynamic text color
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]} // Added dynamic text color
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </View>

            {/* Wired up Sign Up Button to Firebase function */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={{ marginTop: 10 }}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary || '#ffffff'} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: colors.onPrimary || '#ffffff' }]}>Sign Up</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, { color: colors.accent2 }]}>Login</Text>
              </TouchableOpacity>
            </View>

          </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center', // Centers everything vertically since scrolling is removed
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50, // Reduced to 50 to match Login screen style
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    height: 50, // Reduced to 50 to match Login screen style
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});