// src/screens/JobDetails.js

import React, { useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db, auth } from "../config/firebase";
import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";

export default function JobDetails({ route, navigation }) {
  const { job } = route.params || {};

  const { colors } = useTheme();

  const styles = useMemo(
    () => getStyles(colors),
    [colors]
  );

  const [modalVisible, setModalVisible] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Stores the Firestore document ID of the application
  const [applicationId, setApplicationId] = useState(null);

  // Loading state while checking whether the user already applied
  const [checkingApplication, setCheckingApplication] = useState(true);

  /*
   * ------------------------------------------------------------
   * JOB ID
   * ------------------------------------------------------------
   *
   * Saved jobs may have:
   *
   * job.id
   *
   * while the original job ID may be:
   *
   * job.originalJobId
   *
   * We support both.
   */
  const jobId = job?.originalJobId || job?.jobId || job?.id;

  /*
   * ------------------------------------------------------------
   * CHECK WHETHER USER ALREADY APPLIED
   * ------------------------------------------------------------
   */
  useEffect(() => {
    const user = auth?.currentUser;

    if (!user?.uid || !jobId) {
      setApplicationId(null);
      setCheckingApplication(false);
      return;
    }

    const applicationsRef = collection(
      db,
      "job_applications"
    );

    /*
     * Only query by userId.
     *
     * We then filter jobId locally.
     * This avoids needing a Firestore composite index.
     */
    const applicationsQuery = query(
      applicationsRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      applicationsQuery,
      (snapshot) => {
        let foundApplication = null;

        snapshot.forEach((applicationDoc) => {
          const data = applicationDoc.data();

          if (
            data.jobId === jobId ||
            data.originalJobId === jobId
          ) {
            foundApplication = applicationDoc.id;
          }
        });

        setApplicationId(foundApplication);
        setCheckingApplication(false);
      },
      (error) => {
        console.error(
          "Error checking job application:",
          error
        );

        setApplicationId(null);
        setCheckingApplication(false);
      }
    );

    return unsubscribe;
  }, [jobId]);

  /*
   * ------------------------------------------------------------
   * APPLY FOR JOB
   * ------------------------------------------------------------
   */
  const handleApply = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert(
        "Required Fields",
        "Please enter your full name and email address."
      );
      return;
    }

    const currentUser = auth?.currentUser;

    if (!currentUser?.uid) {
      Alert.alert(
        "Sign In Required",
        "Please sign in before applying for a job."
      );
      return;
    }

    if (!jobId) {
      Alert.alert(
        "Error",
        "This job does not have a valid job ID."
      );
      return;
    }

    setSubmitting(true);

    try {
      const applicationRef = await addDoc(
        collection(db, "job_applications"),
        {
          jobId: jobId,

          jobTitle: job.title || "Untitled Job",

          company:
            job.company || "Company not specified",

          location:
            job.location || "Location not specified",

          type:
            job.type || "Opportunity",

          salary: job.salary || "",

          description:
            job.description ||
            job.details ||
            job.jobDescription ||
            "",

          requirements:
            job.requirements || "",

          responsibilities:
            job.responsibilities || "",

          category:
            job.category || "",

          applicationUrl:
            job.applicationUrl ||
            job.url ||
            "",

          applicantName: fullName.trim(),

          applicantEmail:
            email.trim().toLowerCase(),

          applicantPhone:
            phone.trim(),

          coverNote:
            note.trim(),

          userId: currentUser.uid,

          created_at: serverTimestamp(),
        }
      );

      /*
       * Immediately update the button.
       */
      setApplicationId(applicationRef.id);

      setModalVisible(false);

      setFullName("");
      setEmail("");
      setPhone("");
      setNote("");

      Alert.alert(
        "Application Submitted",
        "Your application has been submitted successfully."
      );
    } catch (error) {
      console.error(
        "Failed to submit application:",
        error
      );

      Alert.alert(
        "Error",
        "Could not submit your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * CANCEL JOB APPLICATION
   * ------------------------------------------------------------
   */
  const handleCancelApplication = () => {
    if (!applicationId) {
      return;
    }

    Alert.alert(
      "Cancel Job Application",
      `Are you sure you want to cancel your application for ${
        job?.title || "this job"
      }?`,
      [
        {
          text: "Keep Application",
          style: "cancel",
        },
        {
          text: "Cancel Job",
          style: "destructive",
          onPress: confirmCancelApplication,
        },
      ]
    );
  };

  /*
   * ------------------------------------------------------------
   * DELETE APPLICATION
   * ------------------------------------------------------------
   */
  const confirmCancelApplication = async () => {
    const currentUser = auth?.currentUser;

    if (!currentUser?.uid) {
      Alert.alert(
        "Sign In Required",
        "Please sign in first."
      );
      return;
    }

    if (!applicationId) {
      return;
    }

    setCancelling(true);

    try {
      const applicationRef = doc(
        db,
        "job_applications",
        applicationId
      );

      await deleteDoc(applicationRef);

      /*
       * Immediately change:
       *
       * Cancel Job
       *
       * back to:
       *
       * Apply for this Job
       */
      setApplicationId(null);

      Alert.alert(
        "Application Cancelled",
        "Your job application has been cancelled."
      );
    } catch (error) {
      console.error(
        "Failed to cancel job application:",
        error
      );

      Alert.alert(
        "Error",
        "Could not cancel your application. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (!job) {
    return (
      <SafeScreen style={styles.page}>
        <Text
          style={{
            color: colors.text,
            padding: 20,
          }}
        >
          No opportunity details found.
        </Text>
      </SafeScreen>
    );
  }

  /*
   * ------------------------------------------------------------
   * MAIN BUTTON
   * ------------------------------------------------------------
   */
  const renderApplicationButton = () => {
    if (checkingApplication) {
      return (
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { opacity: 0.7 },
          ]}
          disabled
        >
          <ActivityIndicator
            color={colors.onPrimary || "#fff"}
          />
        </TouchableOpacity>
      );
    }

    /*
     * USER HAS ALREADY APPLIED
     */
    if (applicationId) {
      return (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelApplication}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.cancelButtonText}>
              Cancel Job
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    /*
     * USER HAS NOT APPLIED
     */
    return (
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.primaryButtonText}>
          {job.type === "Job"
            ? "Apply for this Job"
            : "Express Interest"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeScreen
      scroll
      style={styles.page}
      contentContainerStyle={styles.pageContent}
    >
      {/* BACK */}
      <TouchableOpacity
        onPress={() => {
          if (
            navigation &&
            typeof navigation.goBack === "function"
          ) {
            navigation.goBack();
          }
        }}
        style={{ marginBottom: 16 }}
      >
        <Text style={styles.backButton}>
          ← Back to Opportunities
        </Text>
      </TouchableOpacity>

      {/* HEADER */}
      <View style={styles.headerBox}>
        <Text style={styles.badge}>
          {job.type || "Opportunity"}
        </Text>

        <Text style={styles.title}>
          {job.title || "Untitled Job"}
        </Text>

        <Text style={styles.company}>
          {job.company || "Company not specified"}
        </Text>

        <Text style={styles.meta}>
          📍 {job.location || "Location not specified"}
          {"   •   "}
          💰 {job.salary || "Competitive"}
        </Text>
      </View>

      {/* DESCRIPTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          About the Role
        </Text>

        <Text style={styles.bodyText}>
          {job.description ||
            job.details ||
            job.jobDescription ||
            "No description provided."}
        </Text>
      </View>

      {/* REQUIREMENTS */}
      {job.requirements ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Requirements
          </Text>

          <Text style={styles.bodyText}>
            {job.requirements}
          </Text>
        </View>
      ) : null}

      {/* RESPONSIBILITIES */}
      {job.responsibilities ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Responsibilities
          </Text>

          <Text style={styles.bodyText}>
            {job.responsibilities}
          </Text>
        </View>
      ) : null}

      {/* APPLICATION BUTTON */}
      {renderApplicationButton()}

      {/* APPLICATION MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!submitting) {
            setModalVisible(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Apply: {job.title}
            </Text>

            <Text style={styles.modalSub}>
              {job.company}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={
                colors.textMuted
              }
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Why are you interested? (optional)"
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { marginTop: 12 },
              ]}
              onPress={handleApply}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator
                  color={
                    colors.onPrimary || "#fff"
                  }
                />
              ) : (
                <Text
                  style={styles.primaryButtonText}
                >
                  Submit Application
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                setModalVisible(false)
              }
              disabled={submitting}
            >
              <Text
                style={styles.secondaryButtonText}
              >
                Cancel
              </Text>
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
    backgroundColor:
      colors.bg || colors.background,
  },

  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  backButton: {
    fontSize: 16,
    color:
      colors.primary || "#8B5CF6",
    fontWeight: "600",
  },

  headerBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor:
      colors.primary || "#8B5CF6",
    color:
      colors.onPrimary || "#fff",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },

  company: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: 8,
  },

  meta: {
    fontSize: 14,
    color: colors.textMuted,
  },

  section: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },

  primaryButton: {
    backgroundColor:
      colors.primary || "#8B5CF6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  primaryButtonText: {
    color:
      colors.onPrimary || "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },

  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },

  modalSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    color: colors.text,
    backgroundColor: colors.input,
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
});