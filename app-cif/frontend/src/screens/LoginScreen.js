// src/screens/LoginScreen.js
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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Direct Firebase Authentication & Firestore imports
import { auth, db } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Expo OAuth Tools (For Microsoft flow)
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const isExpoGo =
  Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function LoginScreen({ navigation }) {
  const [authMode, setAuthMode] = useState('email'); // 'email' | 'phone'

  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  // Helper to sync/create user in Firestore
  const syncUserToFirestore = async (user) => {
    if (!user || !db) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Festival Attendee',
          photoURL: user.photoURL || null,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync user to Firestore:', err.message);
    }
  };

  // 1. Safe Google Sign-In Flow
  const handleGoogleLogin = async () => {
    if (isLoading) return;

    if (isExpoGo) {
      Alert.alert(
        'Expo Go Notice',
        'Native Google Sign-In requires a custom Development Build (npx expo run:ios/android). Please use Email/Password while testing in Expo Go.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');

      // Check Google Play Services availability (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Trigger OS native sign-in dialog
      const response = await GoogleSignin.signIn();

      // Handle v13+ response structure or legacy fallback
      const idToken = response?.data?.idToken ?? response?.idToken;

      if (!idToken) {
        throw new Error('No ID token returned from Google Sign-In.');
      }

      // Authenticate with Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);

      await syncUserToFirestore(userCred.user);
      navigation.replace('MainApp');
    } catch (error) {
      if (error?.code === 'SIGN_IN_CANCELLED' || error?.code === '12501') {
        console.log('User cancelled Google sign-in');
      } else {
        console.error('Google Sign-In Error:', error);
        Alert.alert(
          'Google Sign-In Error',
          error.message || 'Unable to sign in with Google.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email Login (with Verification Enforcement)
  const handleLogin = async () => {
    const emailTrimmed = email.trim();
    if (!emailTrimmed || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(
        auth,
        emailTrimmed,
        password
      );
      const user = userCred.user;

      // Force refresh user data to check email verification status
      await user.reload();

      if (!user.emailVerified) {
        await signOut(auth);

        Alert.alert(
          'Email Not Verified',
          'Please verify your email address via the link sent to your inbox before logging in.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Resend Email',
              onPress: async () => {
                try {
                  await sendEmailVerification(user);
                  Alert.alert(
                    'Sent',
                    'A new verification link has been sent to your email.'
                  );
                } catch (resendErr) {
                  Alert.alert('Error', resendErr.message);
                }
              },
            },
          ]
        );
        setIsLoading(false);
        return;
      }

      await syncUserToFirestore(user);
      navigation.replace('MainApp');
    } catch (error) {
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        Alert.alert('Login Failed', 'Incorrect email or password.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Please enter a valid email address.');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Phone OTP Verification
  const handleConfirmPhoneCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode.trim()
      );
      const userCred = await signInWithCredential(auth, credential);
      await syncUserToFirestore(userCred.user);
      navigation.replace('MainApp');
    } catch (error) {
      Alert.alert('Verification Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Microsoft OAuth Login
  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);

      const clientId = 'YOUR_MICROSOFT_APPLICATION_CLIENT_ID';

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'cifapp',
        path: 'oauth',
      });

      const discovery = {
        authorizationEndpoint:
          'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      };

      const request = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        usePKCE: false,
        responseType: AuthSession.ResponseType.IdToken,
        scopes: ['openid', 'profile', 'email'],
        extraParams: {
          nonce: Math.random().toString(36).substring(2),
        },
      });

      const result = await request.promptAsync(discovery);

      if (result.type !== 'success') {
        setIsLoading(false);
        return;
      }

      const idToken = result.params?.id_token;
      if (!idToken) {
        throw new Error('Microsoft did not return an ID token.');
      }

      const provider = new OAuthProvider('microsoft.com');
      const credential = provider.credential({
        idToken: idToken,
      });

      const userCred = await signInWithCredential(auth, credential);
      await syncUserToFirestore(userCred.user);
      navigation.replace('MainApp');
    } catch (error) {
      console.log('Microsoft Sign-In Error:', error);
      Alert.alert(
        'Microsoft Sign-In Error',
        error?.message || 'Unable to sign in with Microsoft.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Password Reset Flow
  const handleForgotPassword = async () => {
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      Alert.alert(
        'Missing Email',
        'Please type your email address into the box first, then press Forgot Password.'
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, emailTrimmed);
      Alert.alert(
        'Email Sent!',
        'Check your inbox. We sent you a link to reset your password.'
      );
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No account found with this email address.');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <SafeScreen style={[styles.rootContainer, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* TOP HEADER SECTION */}
          <View style={styles.headerWrapper}>
            <LinearGradient
              colors={[colors.primary, colors.card]}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 1.0 }}
              style={StyleSheet.absoluteFillObject}
            />

            <LinearGradient
              colors={[
                'rgba(217, 38, 169, 0.4)',
                'transparent',
                'rgba(59, 130, 246, 0.35)',
              ]}
              start={{ x: 0, y: 0.3 }}
              end={{ x: 1, y: 0.7 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.titleContainer}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                CREATIVE
              </Text>
              <Text
                style={[styles.gradientTextFallback, { color: colors.text }]}
              >
                INDUSTRIES
              </Text>
              <Text style={[styles.titleText, { color: colors.text }]}>
                FESTIVAL
              </Text>

              <View style={styles.subtitleRow}>
                <Text style={[styles.subtitleText, { color: colors.text }]}>
                  CREATE
                </Text>
                <Text style={[styles.dot, { color: colors.white + '66' }]}>•</Text>
                <Text style={[styles.subtitleText, { color: colors.text }]}>
                  CONNECT
                </Text>
                <Text style={[styles.dot, { color: colors.white + '66' }]}>•</Text>
                <Text style={[styles.subtitleText, { color: colors.text }]}>
                  INSPIRE
                </Text>
              </View>
            </View>
          </View>

          {/* BOTTOM LOGIN CARD */}
          <View
            style={[
              styles.cardContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.instructionText, { color: colors.textMuted }]}>
              Sign in to continue your experience
            </Text>

            {/* Tab Switcher: Email vs Phone */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  authMode === 'email' && {
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => setAuthMode('email')}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        authMode === 'email' ? colors.primary : colors.textMuted,
                    },
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  authMode === 'phone' && {
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => setAuthMode('phone')}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        authMode === 'phone' ? colors.primary : colors.textMuted,
                    },
                  ]}
                >
                  Phone Number
                </Text>
              </TouchableOpacity>
            </View>

            {authMode === 'email' ? (
              <>
                <View style={styles.inputContainer}>
                  <Feather
                    name="mail"
                    size={18}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email address"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Feather
                    name="lock"
                    size={18}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.rowBetween}>
                  <TouchableOpacity
                    style={styles.rememberMeRow}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxChecked,
                        { borderColor: colors.primary },
                      ]}
                    >
                      {rememberMe && (
                        <Feather
                          name="check"
                          size={12}
                          color={colors.onPrimary}
                        />
                      )}
                    </View>
                    <Text
                      style={[styles.rememberMeText, { color: colors.text }]}
                    >
                      Remember me
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text
                      style={[
                        styles.forgotPasswordText,
                        { color: colors.primary },
                      ]}
                    >
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.accent || colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator
                        color={colors.onPrimary || '#ffffff'}
                      />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Login</Text>
                        <Feather
                          name="arrow-right"
                          size={18}
                          color={colors.onPrimary || '#ffffff'}
                          style={{ marginLeft: 8 }}
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Feather
                    name="phone"
                    size={18}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="+44 7123 456789"
                    placeholderTextColor={colors.textMuted}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>

                {verificationId && (
                  <View style={styles.inputContainer}>
                    <Feather
                      name="check-circle"
                      size={18}
                      color={colors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter 6-digit SMS code"
                      placeholderTextColor={colors.textMuted}
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="number-pad"
                    />
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={
                    verificationId
                      ? handleConfirmPhoneCode
                      : () =>
                          Alert.alert(
                            'SMS',
                            'Verification code flow triggers here.'
                          )
                  }
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.accent || colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator
                        color={colors.onPrimary || '#ffffff'}
                      />
                    ) : (
                      <Text style={styles.loginButtonText}>
                        {verificationId ? 'Verify & Login' : 'Send Code'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                OR CONTINUE WITH
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>

            {/* Google & Microsoft Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { borderColor: colors.border },
                  isLoading && { opacity: 0.7 },
                ]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <FontAwesome5 name="google" size={15} color="#EA4335" />
                <Text style={[styles.socialButtonText, { color: colors.text }]}>
                  Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, { borderColor: colors.border }]}
                onPress={handleMicrosoftLogin}
                disabled={isLoading}
              >
                <FontAwesome5 name="microsoft" size={15} color="#00A4EF" />
                <Text style={[styles.socialButtonText, { color: colors.text }]}>
                  Microsoft
                </Text>
              </TouchableOpacity>
            </View>

            {/* Continue as Guest */}
            <TouchableOpacity
              style={styles.guestButton}
              activeOpacity={0.7}
              onPress={() => navigation.replace('GuestApp')}
            >
              <Feather name="user" size={16} color={colors.primary} />
              <Text style={[styles.guestButtonText, { color: colors.text }]}>
                Continue as Guest
              </Text>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </TouchableOpacity>

            {/* Create Account Link */}
            <View style={styles.createAccountRow}>
              <Text style={[styles.noAccountText, { color: colors.textMuted }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text
                  style={[
                    styles.createAccountText,
                    { color: colors.accent2 || colors.primary },
                  ]}
                >
                  Create Account{' '}
                </Text>
                <Feather
                  name="chevron-right"
                  size={14}
                  color={colors.accent2 || colors.primary}
                  style={{ marginTop: 1 }}
                />
              </TouchableOpacity>
            </View>

            {/* Footer Branding */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                POWERED BY
              </Text>
              <View
                style={[styles.dcLogo, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    styles.dcLogoText,
                    { color: colors.onPrimary || '#ffffff' },
                  ]}
                >
                  DC
                </Text>
              </View>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                DOCKLANDS CREATIVE
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  headerWrapper: {
    minHeight: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 24,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  gradientTextFallback: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginVertical: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  subtitleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  dot: {
    fontSize: 10,
  },
  cardContainer: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 12,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {},
  rememberMeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  socialButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  guestButtonText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  createAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  noAccountText: {
    fontSize: 12,
  },
  createAccountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  dcLogo: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dcLogoText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});