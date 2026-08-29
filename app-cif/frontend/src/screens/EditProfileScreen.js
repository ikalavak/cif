import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";

import { auth } from "../config/firebase";

import {
  reload,
  sendEmailVerification,
  updatePassword,
  updateProfile,
} from "firebase/auth";

export default function EditProfileScreen({
  navigation,
}) {
  const { colors } = useTheme();

  // ==================================================
  // PROFILE
  // ==================================================

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ==================================================
  // EMAIL VERIFICATION
  // ==================================================

  const [emailVerified, setEmailVerified] =
    useState(false);

  const [sendingVerification, setSendingVerification] =
    useState(false);

  const [checkingVerification, setCheckingVerification] =
    useState(false);

  const [saving, setSaving] = useState(false);

  // ==================================================
  // PROFILE IS LOCKED UNTIL FIREBASE SAYS VERIFIED
  // ==================================================

  const fieldsLocked = !emailVerified;

  // ==================================================
  // LOAD CURRENT FIREBASE USER
  // ==================================================

  const refreshVerificationStatus = async () => {
    const user = auth.currentUser;

    if (!user) {
      return false;
    }

    try {
      /*
       * IMPORTANT:
       *
       * reload() gets the latest Firebase user.
       * This is necessary after the user clicks the
       * verification link in their email.
       */
      await reload(user);

      const updatedUser = auth.currentUser;

      if (!updatedUser) {
        return false;
      }

      console.log(
        "Firebase email:",
        updatedUser.email
      );

      console.log(
        "Firebase emailVerified:",
        updatedUser.emailVerified
      );

      const verified =
        updatedUser.emailVerified === true;

      setEmailVerified(verified);

      return verified;
    } catch (error) {
      console.log(
        "Refresh verification error:",
        error
      );

      return false;
    }
  };

  // ==================================================
  // LOAD PROFILE
  // ==================================================

  const loadProfile = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Not Logged In",
        "Please log in before editing your profile."
      );

      if (navigation?.goBack) {
        navigation.goBack();
      }

      return;
    }

    try {
      /*
       * Get the newest Firebase user information.
       */
      await reload(user);

      const updatedUser = auth.currentUser;

      if (!updatedUser) {
        return;
      }

      // ----------------------------------------------
      // LOAD NAME
      // ----------------------------------------------

      if (updatedUser.displayName) {
        const names =
          updatedUser.displayName
            .trim()
            .split(" ");

        setFirstName(names[0] || "");

        setLastName(
          names.slice(1).join(" ") || ""
        );
      }

      // ----------------------------------------------
      // LOAD VERIFICATION STATUS
      // ----------------------------------------------

      const verified =
        updatedUser.emailVerified === true;

      setEmailVerified(verified);

      console.log(
        "PROFILE LOADED"
      );

      console.log(
        "Email:",
        updatedUser.email
      );

      console.log(
        "Verified:",
        verified
      );
    } catch (error) {
      console.log(
        "Load profile error:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to load your profile."
      );
    }
  }, [navigation]);

  // ==================================================
  // LOAD WHEN SCREEN OPENS
  // ==================================================

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ==================================================
  // CHECK AGAIN WHEN RETURNING TO THIS SCREEN
  // ==================================================

  useFocusEffect(
    useCallback(() => {
      const checkWhenReturning = async () => {
        const user = auth.currentUser;

        if (!user) {
          return;
        }

        try {
          await reload(user);

          const updatedUser =
            auth.currentUser;

          if (!updatedUser) {
            return;
          }

          const verified =
            updatedUser.emailVerified === true;

          console.log(
            "RETURNED TO APP"
          );

          console.log(
            "Email verified:",
            verified
          );

          setEmailVerified(verified);
        } catch (error) {
          console.log(
            "Automatic verification check error:",
            error
          );
        }
      };

      checkWhenReturning();
    }, [])
  );

  // ==================================================
  // SEND NEW VERIFICATION EMAIL
  // ==================================================

  const handleVerification = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Error",
        "No user is currently signed in."
      );

      return;
    }

    try {
      setSendingVerification(true);

      /*
       * Always refresh before sending.
       */
      await reload(user);

      const updatedUser =
        auth.currentUser;

      if (!updatedUser) {
        Alert.alert(
          "Error",
          "Unable to find your account."
        );

        return;
      }

      // ==================================================
      // ALREADY VERIFIED
      // ==================================================

      if (updatedUser.emailVerified === true) {
        setEmailVerified(true);

        Alert.alert(
          "Already Verified",
          "Your email address is already verified. You can edit your profile."
        );

        return;
      }

      // ==================================================
      // SEND A NEW FIREBASE VERIFICATION LINK
      // ==================================================

      await sendEmailVerification(
        updatedUser
      );

      /*
       * Do NOT set emailVerified to true here.
       *
       * Sending the email does NOT mean the email
       * has been verified.
       */
      setEmailVerified(false);

      console.log(
        "NEW VERIFICATION LINK SENT"
      );

      console.log(
        "Sent to:",
        updatedUser.email
      );

      Alert.alert(
        "New Verification Email Sent",
        `A new verification link has been sent to ${updatedUser.email}.\n\nOpen the newest email and click the verification link.\n\nThen return to this screen and press "Check Verification".`
      );
    } catch (error) {
      console.log(
        "Send verification error:",
        error
      );

      // ==================================================
      // FIREBASE RATE LIMIT
      // ==================================================

      if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        Alert.alert(
          "Too Many Requests",
          "Firebase has temporarily stopped sending verification emails because too many requests were made. Please wait a little while and try again."
        );

        return;
      }

      // ==================================================
      // OTHER ERROR
      // ==================================================

      Alert.alert(
        "Verification Error",
        error?.message ||
          "Unable to send a new verification email."
      );
    } finally {
      setSendingVerification(false);
    }
  };

  // ==================================================
  // CHECK VERIFICATION
  // ==================================================

  const checkVerification = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Error",
        "No user is currently signed in."
      );

      return;
    }

    try {
      setCheckingVerification(true);

      /*
       * ALWAYS reload Firebase.
       *
       * This is what detects that the user clicked
       * the verification link outside the app.
       */
      await reload(user);

      const updatedUser =
        auth.currentUser;

      if (!updatedUser) {
        return;
      }

      console.log(
        "CHECKING VERIFICATION"
      );

      console.log(
        "Email:",
        updatedUser.email
      );

      console.log(
        "emailVerified:",
        updatedUser.emailVerified
      );

      // ==================================================
      // VERIFIED
      // ==================================================

      if (updatedUser.emailVerified === true) {
        setEmailVerified(true);

        Alert.alert(
          "Email Verified",
          "Your email has been successfully verified. You can now edit your profile."
        );

        return;
      }

      // ==================================================
      // NOT VERIFIED
      // ==================================================

      setEmailVerified(false);

      Alert.alert(
        "Not Verified Yet",
        "Firebase has not detected the verification yet. Make sure you clicked the newest verification link, then press Check Verification again."
      );
    } catch (error) {
      console.log(
        "Check verification error:",
        error
      );

      Alert.alert(
        "Verification Error",
        error?.message ||
          "Unable to check your verification status."
      );
    } finally {
      setCheckingVerification(false);
    }
  };

  // ==================================================
  // SAVE PROFILE
  // ==================================================

  const saveProfile = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Error",
        "You are not logged in."
      );

      return;
    }

    try {
      /*
       * Always check Firebase again before saving.
       */
      await reload(user);

      const updatedUser =
        auth.currentUser;

      if (!updatedUser) {
        return;
      }

      // ==================================================
      // VERIFY AGAIN
      // ==================================================

      if (updatedUser.emailVerified !== true) {
        setEmailVerified(false);

        Alert.alert(
          "Email Verification Required",
          "Please verify your email before saving profile changes."
        );

        return;
      }

      // ==================================================
      // VALIDATE FIRST NAME
      // ==================================================

      if (!firstName.trim()) {
        Alert.alert(
          "Missing First Name",
          "Please enter your first name."
        );

        return;
      }

      // ==================================================
      // VALIDATE LAST NAME
      // ==================================================

      if (!lastName.trim()) {
        Alert.alert(
          "Missing Last Name",
          "Please enter your last name."
        );

        return;
      }

      // ==================================================
      // VALIDATE PASSWORD
      // ==================================================

      if (
        password.length > 0 ||
        confirmPassword.length > 0
      ) {
        if (password.length < 6) {
          Alert.alert(
            "Invalid Password",
            "Password must contain at least 6 characters."
          );

          return;
        }

        if (
          password !== confirmPassword
        ) {
          Alert.alert(
            "Passwords Do Not Match",
            "Please make sure both passwords match."
          );

          return;
        }
      }

      setSaving(true);

      // ==================================================
      // UPDATE NAME
      // ==================================================

      await updateProfile(
        updatedUser,
        {
          displayName:
            `${firstName.trim()} ${lastName.trim()}`,
        }
      );

      // ==================================================
      // UPDATE PASSWORD
      // ==================================================

      if (password.trim()) {
        try {
          await updatePassword(
            updatedUser,
            password
          );
        } catch (passwordError) {
          console.log(
            "Password update error:",
            passwordError
          );

          if (
            passwordError?.code ===
            "auth/requires-recent-login"
          ) {
            Alert.alert(
              "Log In Again",
              "For security, Firebase requires you to log in again before changing your password."
            );

            return;
          }

          throw passwordError;
        }
      }

      // ==================================================
      // CLEAR PASSWORD
      // ==================================================

      setPassword("");
      setConfirmPassword("");

      // ==================================================
      // SUCCESS
      // ==================================================

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              if (navigation?.goBack) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "Save profile error:",
        error
      );

      if (
        error?.code ===
        "auth/requires-recent-login"
      ) {
        Alert.alert(
          "Log In Again",
          "For security, Firebase requires you to log in again before changing your profile."
        );

        return;
      }

      Alert.alert(
        "Update Failed",
        error?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // BACK
  // ==================================================

  const handleBack = () => {
    setPassword("");
    setConfirmPassword("");

    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <SafeScreen
      scroll
      style={[
        styles.screen,
        {
          backgroundColor: colors.bg,
        },
      ]}
      contentContainerStyle={{
        paddingBottom: 30,
      }}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor:
                colors.card,
            },
          ]}
          onPress={handleBack}
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
            {
              color: colors.text,
            },
          ]}
        >
          Edit Profile
        </Text>

        <View
          style={{
            width: 40,
          }}
        />
      </View>

      <View style={styles.container}>

        {/* ==================================================
            VERIFICATION STATUS
        ================================================== */}

        <View
          style={[
            styles.verificationBox,
            {
              backgroundColor:
                colors.card,
            },
          ]}
        >
          <Feather
            name={
              emailVerified
                ? "check-circle"
                : "alert-circle"
            }
            size={24}
            color={
              emailVerified
                ? colors.primary
                : colors.error
            }
          />

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={[
                styles.verificationTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {emailVerified
                ? "Email Verified"
                : "Email Not Verified"}
            </Text>

            <Text
              style={[
                styles.verificationText,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              {emailVerified
                ? "Your email is verified. You can edit your profile."
                : "Verify your email before editing your profile."}
            </Text>
          </View>
        </View>

        {/* ==================================================
            SEND NEW VERIFICATION EMAIL
        ================================================== */}

        {!emailVerified && (
          <TouchableOpacity
            style={[
              styles.verifyButton,
              {
                backgroundColor:
                  colors.accent,
                opacity:
                  sendingVerification
                    ? 0.6
                    : 1,
              },
            ]}
            onPress={
              handleVerification
            }
            disabled={
              sendingVerification
            }
          >
            {sendingVerification ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <Feather
                  name="mail"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Send New Verification Email
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* ==================================================
            CHECK VERIFICATION
        ================================================== */}

        {!emailVerified && (
          <TouchableOpacity
            style={[
              styles.checkButton,
              {
                borderColor:
                  colors.primary,
                opacity:
                  checkingVerification
                    ? 0.6
                    : 1,
              },
            ]}
            onPress={
              checkVerification
            }
            disabled={
              checkingVerification
            }
          >
            {checkingVerification ? (
              <ActivityIndicator
                color={
                  colors.primary
                }
              />
            ) : (
              <>
                <Feather
                  name="refresh-cw"
                  size={18}
                  color={
                    colors.primary
                  }
                />

                <Text
                  style={[
                    styles.checkButtonText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  Check Verification
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {!emailVerified && (
          <Text
            style={[
              styles.lockedHint,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            You can request a new verification email,
            then check your verification status again
            after clicking the newest link.
          </Text>
        )}

        {/* ==================================================
            PROFILE FIELDS
        ================================================== */}

        <View
          pointerEvents={
            fieldsLocked
              ? "none"
              : "auto"
          }
          style={{
            opacity:
              fieldsLocked
                ? 0.4
                : 1,
          }}
        >

          {/* FIRST NAME */}

          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            First Name
          </Text>

          <TextInput
            value={firstName}
            onChangeText={
              setFirstName
            }
            placeholder="Enter first name"
            placeholderTextColor={
              colors.textMuted
            }
            editable={
              !fieldsLocked
            }
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.card,
                color:
                  colors.text,
                borderColor:
                  colors.border,
              },
            ]}
          />

          {/* LAST NAME */}

          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Last Name
          </Text>

          <TextInput
            value={lastName}
            onChangeText={
              setLastName
            }
            placeholder="Enter last name"
            placeholderTextColor={
              colors.textMuted
            }
            editable={
              !fieldsLocked
            }
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.card,
                color:
                  colors.text,
                borderColor:
                  colors.border,
              },
            ]}
          />

          {/* NEW PASSWORD */}

          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Change Password
          </Text>

          <TextInput
            value={password}
            onChangeText={
              setPassword
            }
            placeholder="Enter new password"
            placeholderTextColor={
              colors.textMuted
            }
            secureTextEntry
            editable={
              !fieldsLocked
            }
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.card,
                color:
                  colors.text,
                borderColor:
                  colors.border,
              },
            ]}
          />

          {/* CONFIRM PASSWORD */}

          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Confirm Password
          </Text>

          <TextInput
            value={
              confirmPassword
            }
            onChangeText={
              setConfirmPassword
            }
            placeholder="Confirm new password"
            placeholderTextColor={
              colors.textMuted
            }
            secureTextEntry
            editable={
              !fieldsLocked
            }
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.card,
                color:
                  colors.text,
                borderColor:
                  colors.border,
              },
            ]}
          />

          {/* SAVE */}

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  colors.primary,
                opacity:
                  saving ||
                  fieldsLocked
                    ? 0.6
                    : 1,
              },
            ]}
            onPress={saveProfile}
            disabled={
              saving ||
              fieldsLocked
            }
          >
            {saving ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                Save Changes
              </Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </SafeScreen>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  container: {
    paddingHorizontal: 20,
  },

  verificationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderRadius: 12,
    marginTop: 5,
  },

  verificationTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 3,
  },

  verificationText: {
    fontSize: 13,
    lineHeight: 18,
  },

  verifyButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },

  checkButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
  },

  checkButtonText: {
    fontSize: 15,
    fontWeight: "bold",
  },

  lockedHint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
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

  saveButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});

