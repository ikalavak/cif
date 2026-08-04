import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// 1. Accept the navigation prop here
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useTheme();

  return (
    <SafeScreen scroll style={[styles.rootContainer, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scrollContent}>
      {/* StatusBar handled at App root to keep consistent barStyle per theme */}
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              colors={['rgba(217, 38, 169, 0.4)', 'transparent', 'rgba(59, 130, 246, 0.35)']}
              start={{ x: 0, y: 0.3 }}
              end={{ x: 1, y: 0.7 }}
              style={StyleSheet.absoluteFillObject}
            />

            <TouchableOpacity style={[styles.settingsButton, { backgroundColor: colors.white + '26' }] }>
              <Ionicons name="settings-sharp" size={18} color={colors.white + 'CC'} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={[styles.titleText, { color: colors.text }]}>CREATIVE</Text>
              <Text style={[styles.gradientTextFallback, { color: colors.accent2 }]}>INDUSTRIES</Text>
              <Text style={[styles.titleText, { color: colors.text }]}>FESTIVAL</Text>
              
              <View style={styles.subtitleRow}>
                <Text style={[styles.subtitleText, { color: colors.accent2 }]}>CREATE</Text>
                <Text style={[styles.dot, { color: colors.white + '66' }]}>•</Text>
                <Text style={[styles.subtitleText, { color: colors.accent2 }]}>CONNECT</Text>
                <Text style={[styles.dot, { color: colors.white + '66' }]}>•</Text>
                <Text style={[styles.subtitleText, { color: colors.accent2 }]}>INSPIRE</Text>
              </View>
            </View>
          </View>

          {/* BOTTOM LOGIN CARD */}
            <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }] }>
            <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.instructionText, { color: colors.textMuted }]}>Sign in to continue your experience</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
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
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.rowBetween}>
              <TouchableOpacity 
                style={styles.rememberMeRow} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked, { borderColor: colors.primary }] }>
                  {rememberMe && <Feather name="check" size={12} color={colors.onPrimary} />}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity>
                <Text style={[styles.forgotPasswordText, { color: colors.accent2 }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Wire up the Login Button */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.replace('MainApp')}
              >
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Login</Text>
                <Feather name="arrow-right" size={20} color={colors.onPrimary} style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 3. Wire up Continue as Guest */}
            <TouchableOpacity 
              style={styles.guestButton} 
              activeOpacity={0.7}
              onPress={() => navigation.replace('MainApp')}
            >
              <Feather name="user" size={20} color={colors.primary} />
              <Text style={[styles.guestButtonText, { color: colors.text }]}>Continue as Guest</Text>
              <Feather name="arrow-right" size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* 4. Wire up Create Account Link */}
            <View style={styles.createAccountRow}>
                <Text style={[styles.noAccountText, { color: colors.textMuted }]}>Don't have an account? </Text>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={[styles.createAccountText, { color: colors.accent2 }]}>Create Account </Text>
                <Feather name="chevron-right" size={14} color={colors.accent2} style={{ marginTop: 1 }} />
              </TouchableOpacity>
            </View>

            {/* Footer Logo */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>POWERED BY</Text>
              <View style={styles.dcLogo}>
                <Text style={[styles.dcLogoText, { color: colors.onPrimary }]}>DC</Text>
              </View>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>DOCKLANDS CREATIVE</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  headerWrapper: {
    height: 300,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 54,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 5,
  },
  gradientTextFallback: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    marginVertical: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
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
    paddingTop: 28,
    paddingBottom: 30,
    width: '100%',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    
  },
  rememberMeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    
  },
  dividerText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  guestButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    paddingHorizontal: 16,
    
  },
  guestButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  createAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  noAccountText: {
    fontSize: 14,
  },
  createAccountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  dcLogo: {
    
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dcLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});