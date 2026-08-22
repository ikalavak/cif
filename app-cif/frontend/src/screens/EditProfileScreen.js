import React, { useState, useEffect, } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";


import SafeScreen from "../components/SafeScreen";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

import { auth } from "../config/firebase";

import {
  updateProfile,
  sendEmailVerification,
  updatePassword,
  reload,
} from "firebase/auth";

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // IMPORTANT:
  // This is the verification state for THIS visit to Edit Profile.
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const [sendingVerification, setSendingVerification] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fields remain locked until the user verifies during THIS visit.
  const fieldsLocked = !emailVerified;

  const getUser = () => {
    return auth.currentUser;
  };

  /*
   * Load profile every time this screen is opened.
   *
   * IMPORTANT:
   * We intentionally set emailVerified to FALSE.
   *
   * Firebase may say the account is already verified, but
   * this screen requires a new verification session every time.
   */
  useEffect(() => {
    const loadProfile = async () => {
      const user = getUser();

      if (!user) {
        Alert.alert(
          "Not Logged In",
          "Please log in before editing your profile."
        );

        navigation.goBack();
        return;
      }

      try {
        await reload(user);

        const updatedUser = auth.currentUser;

        /*
         * Load existing name.
         */
        if (updatedUser?.displayName) {
          const names = updatedUser.displayName.split(" ");

          setFirstName(names[0] || "");
          setLastName(names.slice(1).join(" ") || "");
        }

        /*
         * IMPORTANT:
         *
         * Do NOT do:
         *
         * setEmailVerified(updatedUser.emailVerified)
         *
         * because that would immediately unlock the page
         * for previously verified users.
         *
         * Every time Edit Profile opens, the user must
         * complete the verification process again.
         */
        setEmailVerified(false);
        setVerificationSent(false);

        /*
         * Clear password fields every time the screen opens.
         */
        setPassword("");
        setConfirmPassword("");

        console.log("Email:", updatedUser?.email);
        console.log(
          "Firebase emailVerified:",
          updatedUser?.emailVerified
        );
        console.log(
          "Edit Profile verification session:",
          "NOT VERIFIED"
        );
      } catch (error) {
        console.log("Profile loading error:", error);
      }
    };

    loadProfile();
  }, []);

  /*
   * STEP 1
   *
   * Send a REAL Firebase verification email.
   */
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
     * Get the latest Firebase user.
     */
    await reload(user);

    const updatedUser = auth.currentUser;

    /*
     * Firebase verification is permanent.
     *
     * If the account is already verified, we don't
     * need to send another verification email.
     *
     * We simply start a new Edit Profile verification
     * session.
     */
    if (updatedUser?.emailVerified === true) {
      setVerificationSent(true);

      /*
       * We still keep the Edit Profile fields locked
       * until the user presses Check Verification.
       */
      setEmailVerified(false);

      Alert.alert(
        "Verification Required",
        "Your email is already verified with Firebase. Press \"Check Verification\" to verify this Edit Profile session."
      );

      return;
    }

    /*
     * If the email has never been verified,
     * send the real Firebase verification email.
     */
    await sendEmailVerification(updatedUser);

    setVerificationSent(true);
    setEmailVerified(false);

    Alert.alert(
      "Verification Email Sent",
      `A verification link has been sent to ${updatedUser.email}.\n\nOpen the email, click the verification link, return to the app, and press "Check Verification".`
    );
  } catch (error) {
    console.log(
      "Verification email error:",
      error
    );

    if (error?.code === "auth/too-many-requests") {
      Alert.alert(
        "Too Many Requests",
        "Firebase has temporarily limited verification emails. Please wait before requesting another email."
      );
    } else {
      Alert.alert(
        "Verification Error",
        error?.message ||
          "Unable to send the verification email."
      );
    }
  } finally {
    setSendingVerification(false);
  }
};

  /*
   * STEP 2
   *
   * Check Firebase AFTER the user has clicked
   * the verification link.
   */
  const checkVerification = async () => {
  if (!verificationSent) {
    Alert.alert(
      "Send Verification First",
      "Please press the verification button first."
    );
    return;
  }

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
     * Refresh the Firebase user.
     *
     * This gets the latest emailVerified value
     * after the user clicks the email link.
     */
    await reload(user);

    const updatedUser = auth.currentUser;

    console.log(
      "Firebase emailVerified:",
      updatedUser?.emailVerified
    );

    /*
     * Firebase says the email is verified.
     *
     * Now we unlock this Edit Profile session.
     */
    if (updatedUser?.emailVerified === true) {
      setEmailVerified(true);

      Alert.alert(
        "Email Verified",
        "Your email has been verified. You can now edit your profile."
      );

      return;
    }

    /*
     * Firebase still says the email is not verified.
     */
    setEmailVerified(false);

    Alert.alert(
      "Not Verified",
      "Your email has not been verified yet. Please open the verification email, click the verification link, and then press Check Verification again."
    );
  } catch (error) {
    console.log(
      "Verification check error:",
      error
    );

    Alert.alert(
      "Verification Error",
      error?.message ||
        "Unable to check verification."
    );
  } finally {
    setCheckingVerification(false);
  }
}; 
  /*
   * SAVE PROFILE
   */
  const saveProfile = async () => {
    const user = getUser();

    if (!user) {
      Alert.alert(
        "Error",
        "You are not logged in."
      );

      return;
    }

    try {
      /*
       * Always reload before saving.
       */
      await reload(user);

      const updatedUser = auth.currentUser;

      /*
       * Firebase must still say verified.
       */
      if (!updatedUser?.emailVerified) {
        setEmailVerified(false);

        Alert.alert(
          "Email Verification Required",
          "Please verify your email address before saving your profile changes."
        );

        return;
      }

      /*
       * First name validation.
       */
      if (!firstName.trim()) {
        Alert.alert(
          "Error",
          "Please enter your first name."
        );

        return;
      }

      /*
       * Last name validation.
       */
      if (!lastName.trim()) {
        Alert.alert(
          "Error",
          "Please enter your last name."
        );

        return;
      }

      /*
       * Password validation.
       */
      if (password || confirmPassword) {
        if (password.length < 6) {
          Alert.alert(
            "Invalid Password",
            "Password must be at least 6 characters."
          );

          return;
        }

        if (password !== confirmPassword) {
          Alert.alert(
            "Passwords Do Not Match",
            "Please make sure both passwords are the same."
          );

          return;
        }
      }

      setSaving(true);

      /*
       * Update name.
       */
      await updateProfile(updatedUser, {
        displayName:
          `${firstName.trim()} ${lastName.trim()}`,
      });

      /*
       * Update password if entered.
       */
      if (password.trim()) {
        await updatePassword(
          updatedUser,
          password
        );
      }

      /*
       * Clear password fields.
       */
      setPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Profile Updated",
        "Your profile changes have been saved successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              /*
               * IMPORTANT:
               *
               * Reset the verification session BEFORE
               * leaving the screen.
               */
              setEmailVerified(false);
              setVerificationSent(false);

              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "Profile update error:",
        error
      );

      if (
        error.code ===
        "auth/requires-recent-login"
      ) {
        Alert.alert(
          "Please Log In Again",
          "For security, Firebase requires you to log in again before changing your password."
        );
      } else {
        Alert.alert(
          "Update Failed",
          error?.message ||
            "Unable to update your profile."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /*
   * BACK BUTTON
   *
   * Always reset the verification session.
   */
  const handleBack = () => {
    setEmailVerified(false);
    setVerificationSent(false);

    setPassword("");
    setConfirmPassword("");

    navigation.goBack();
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
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.card },
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
            { color: colors.text },
          ]}
        >
          Edit Profile
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>

        {/* VERIFICATION STATUS */}

        <View
          style={[
            styles.verificationBox,
            { backgroundColor: colors.card },
          ]}
        >
          <Feather
            name={
              emailVerified
                ? "check-circle"
                : "alert-circle"
            }
            size={22}
            color={
              emailVerified
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
              {emailVerified
                ? "Email Verified"
                : "Verification Required"}
            </Text>

            <Text
              style={[
                styles.verificationText,
                { color: colors.textMuted },
              ]}
            >
              {emailVerified
                ? "Your email has been verified for this editing session."
                : "You must verify your email before you can edit your profile."}
            </Text>
          </View>
        </View>

        {/* STEP 1 */}

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
            onPress={handleVerification}
            disabled={sendingVerification}
          >
            {sendingVerification ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather
                  name="mail"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.buttonText}>
                  {verificationSent
                    ? "Resend Verification Email"
                    : "1. Send Verification Email"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* STEP 2 */}

        {!emailVerified && (
          <TouchableOpacity
            style={[
              styles.checkButton,
              {
                borderColor:
                  verificationSent
                    ? colors.primary
                    : colors.border,

                opacity:
                  verificationSent
                    ? 1
                    : 0.4,
              },
            ]}
            onPress={checkVerification}
            disabled={
              !verificationSent ||
              checkingVerification
            }
          >
            {checkingVerification ? (
              <ActivityIndicator
                color={colors.primary}
              />
            ) : (
              <>
                <Feather
                  name="refresh-cw"
                  size={18}
                  color={
                    verificationSent
                      ? colors.primary
                      : colors.textMuted
                  }
                />

                <Text
                  style={[
                    styles.checkButtonText,
                    {
                      color:
                        verificationSent
                          ? colors.primary
                          : colors.textMuted,
                    },
                  ]}
                >
                  2. Check Verification
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {!emailVerified &&
          !verificationSent && (
            <Text
              style={[
                styles.lockedHint,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              Send the verification email first to unlock the check button.
            </Text>
          )}

        {/* PROFILE FIELDS */}

        <View
          pointerEvents={
            fieldsLocked
              ? "none"
              : "auto"
          }
          style={{
            opacity: fieldsLocked
              ? 0.4
              : 1,
          }}
        >
          {/* FIRST NAME */}

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
            placeholderTextColor={
              colors.textMuted
            }
            editable={!fieldsLocked}
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.card,
                color: colors.text,
                borderColor:
                  colors.border,
              },
            ]}
          />

          {/* LAST NAME */}

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
            placeholderTextColor={
              colors.textMuted
            }
            editable={!fieldsLocked}
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.card,
                color: colors.text,
                borderColor:
                  colors.border,
              },
            ]}
          />

          {/* NEW PASSWORD */}

          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            Change Password
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password"
            placeholderTextColor={
              colors.textMuted
            }
            secureTextEntry
            editable={!fieldsLocked}
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.card,
                color: colors.text,
                borderColor:
                  colors.border,
              },
            ]}
          />

          {/* CONFIRM PASSWORD */}

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
            onChangeText={
              setConfirmPassword
            }
            placeholder="Confirm new password"
            placeholderTextColor={
              colors.textMuted
            }
            secureTextEntry
            editable={!fieldsLocked}
            style={[
              styles.input,
              {
                backgroundColor:
                  colors.card,
                color: colors.text,
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
              <ActivityIndicator color="#FFFFFF" />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },

  verifyButton: {
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },

  checkButton: {
    height: 48,
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
    marginTop: 6,
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