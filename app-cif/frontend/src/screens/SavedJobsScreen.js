// src/screens/SavedJobsScreen.js

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import SafeScreen from "../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";
import { auth, db } from "../config/firebase";
import { Feather } from "@expo/vector-icons";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function SavedJobsScreen({
  navigation,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () => getStyles(colors),
    [colors]
  );

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [cancellingId, setCancellingId] =
    useState(null);

  /*
   * ------------------------------------------------------------
   * LOAD USER JOB APPLICATIONS
   * ------------------------------------------------------------
   */
  useEffect(() => {
    const user = auth?.currentUser;

    if (!user?.uid) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const applicationsRef = collection(
      db,
      "job_applications"
    );

    /*
     * Only filter by userId.
     *
     * This avoids requiring a composite Firestore index.
     */
    const applicationsQuery = query(
      applicationsRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      applicationsQuery,
      (snapshot) => {
        const loadedApplications =
          snapshot.docs.map(
            (applicationDoc) => {
              const data =
                applicationDoc.data();

              return {
                id: applicationDoc.id,

                jobId:
                  data.jobId ||
                  data.originalJobId ||
                  "",

                title:
                  data.jobTitle ||
                  data.title ||
                  "Untitled Job",

                company:
                  data.company ||
                  "Company not specified",

                location:
                  data.location ||
                  "Location not specified",

                type:
                  data.type ||
                  "Opportunity",

                salary:
                  data.salary || "",

                description:
                  data.description ||
                  data.details ||
                  data.jobDescription ||
                  "No job description available.",

                requirements:
                  data.requirements || "",

                responsibilities:
                  data.responsibilities ||
                  "",

                category:
                  data.category || "",

                applicantName:
                  data.applicantName ||
                  "",

                applicantEmail:
                  data.applicantEmail ||
                  "",

                applicantPhone:
                  data.applicantPhone ||
                  "",

                coverNote:
                  data.coverNote ||
                  "",

                created_at:
                  data.created_at || null,

                ...data,
              };
            }
          );

        /*
         * Newest applications first.
         */
        loadedApplications.sort(
          (a, b) => {
            const timeA =
              a.created_at?.toMillis
                ? a.created_at.toMillis()
                : a.created_at || 0;

            const timeB =
              b.created_at?.toMillis
                ? b.created_at.toMillis()
                : b.created_at || 0;

            return timeB - timeA;
          }
        );

        setApplications(
          loadedApplications
        );

        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error(
          "Error loading job applications:",
          error
        );

        setApplications([]);
        setLoading(false);
        setRefreshing(false);

        Alert.alert(
          "Notice",
          "Could not load your job applications."
        );
      }
    );

    return unsubscribe;
  }, []);

  /*
   * ------------------------------------------------------------
   * REFRESH
   * ------------------------------------------------------------
   */
  const onRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  /*
   * ------------------------------------------------------------
   * CANCEL APPLICATION
   * ------------------------------------------------------------
   */
  const handleCancelApplication = (
    application
  ) => {
    if (!application?.id) {
      return;
    }

    Alert.alert(
      "Cancel Job Application",
      `Are you sure you want to cancel your application for ${
        application.title ||
        "this job"
      }?`,
      [
        {
          text: "Keep Application",
          style: "cancel",
        },
        {
          text: "Cancel Job",
          style: "destructive",
          onPress: () =>
            confirmCancelApplication(
              application
            ),
        },
      ]
    );
  };

  /*
   * ------------------------------------------------------------
   * DELETE APPLICATION
   * ------------------------------------------------------------
   */
  const confirmCancelApplication =
    async (application) => {
      const user = auth?.currentUser;

      if (!user?.uid) {
        Alert.alert(
          "Sign In Required",
          "Please sign in first."
        );
        return;
      }

      if (!application?.id) {
        return;
      }

      setCancellingId(application.id);

      try {
        const applicationRef = doc(
          db,
          "job_applications",
          application.id
        );

        await deleteDoc(applicationRef);

        /*
         * Remove immediately from the screen.
         *
         * onSnapshot will also update the list.
         */
        setApplications(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !== application.id
            )
        );

        Alert.alert(
          "Application Cancelled",
          `${
            application.title ||
            "The job"
          } application has been cancelled.`
        );
      } catch (error) {
        console.error(
          "Error cancelling application:",
          error
        );

        Alert.alert(
          "Cancellation Failed",
          `Could not cancel the application: ${error.message}`
        );
      } finally {
        setCancellingId(null);
      }
    };

  /*
   * ------------------------------------------------------------
   * OPEN JOB DETAILS
   * ------------------------------------------------------------
   */
  const handleOpenJob = (application) => {
    if (
      navigation &&
      typeof navigation.navigate ===
        "function"
    ) {
      navigation.navigate("JobDetails", {
        job: {
          id: application.jobId,
          originalJobId:
            application.jobId,

          title:
            application.title,

          company:
            application.company,

          location:
            application.location,

          type:
            application.type,

          salary:
            application.salary,

          description:
            application.description,

          requirements:
            application.requirements,

          responsibilities:
            application.responsibilities,

          category:
            application.category,

          applicationUrl:
            application.applicationUrl ||
            "",
        },
      });
    }
  };

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   */
  if (loading) {
    return (
      <SafeScreen
        style={styles.screen}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.primary ||
              "#8B5CF6"
            }
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading your applications...
          </Text>
        </View>
      </SafeScreen>
    );
  }

  /*
   * ------------------------------------------------------------
   * MAIN SCREEN
   * ------------------------------------------------------------
   */
  return (
    <SafeScreen
      scroll
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={
            colors.primary ||
            "#8B5CF6"
          }
          colors={[
            colors.primary ||
              "#8B5CF6",
          ]}
        />
      }
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            if (
              navigation &&
              typeof navigation.goBack ===
                "function"
            ) {
              navigation.goBack();
            }
          }}
          style={styles.backIconBtn}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
          pointerEvents="none"
        >
          My Applications
        </Text>
      </View>

      {/* SUBTITLE */}
      <Text style={styles.subtitle}>
        Jobs you have applied for.
      </Text>

      {/* COUNT */}
      <View
        style={styles.countContainer}
      >
        <Feather
          name="briefcase"
          size={17}
          color={
            colors.primary ||
            "#8B5CF6"
          }
        />

        <Text
          style={styles.countText}
        >
          {applications.length}{" "}
          {applications.length === 1
            ? "Application"
            : "Applications"}
        </Text>
      </View>

      {/* EMPTY STATE */}
      {applications.length === 0 ? (
        <View
          style={
            styles.emptyContainer
          }
        >
          <View
            style={styles.emptyIcon}
          >
            <Feather
              name="briefcase"
              size={40}
              color={
                colors.textMuted
              }
            />
          </View>

          <Text
            style={styles.emptyTitle}
          >
            No Applications
          </Text>

          <Text
            style={styles.emptyText}
          >
            When you apply for a job,
            your application will
            appear here.
          </Text>

          <TouchableOpacity
            style={
              styles.browseButton
            }
            onPress={() => {
              if (
                navigation &&
                typeof navigation.navigate ===
                  "function"
              ) {
                navigation.navigate(
                  "JobBoard"
                );
              }
            }}
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.browseButtonText
              }
            >
              Browse Jobs
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /*
         * --------------------------------------------------------
         * APPLICATION CARDS
         * --------------------------------------------------------
         */
        <View style={styles.list}>
          {applications.map(
            (application) => {
              const isCancelling =
                cancellingId ===
                application.id;

              return (
                <View
                  key={application.id}
                  style={styles.card}
                >
                  {/* CLICKABLE JOB AREA */}
                  <TouchableOpacity
                    onPress={() =>
                      handleOpenJob(
                        application
                      )
                    }
                    activeOpacity={0.85}
                  >
                    {/* JOB ICON */}
                    <View
                      style={
                        styles.jobIcon
                      }
                    >
                      <Feather
                        name="briefcase"
                        size={23}
                        color={
                          colors.primary ||
                          "#8B5CF6"
                        }
                      />
                    </View>

                    {/* JOB TITLE */}
                    <Text
                      style={
                        styles.jobTitle
                      }
                      numberOfLines={2}
                    >
                      {application.title}
                    </Text>

                    {/* COMPANY */}
                    <Text
                      style={
                        styles.companyText
                      }
                      numberOfLines={1}
                    >
                      {
                        application.company
                      }
                    </Text>

                    {/* LOCATION */}
                    <View
                      style={
                        styles.infoRow
                      }
                    >
                      <Feather
                        name="map-pin"
                        size={13}
                        color={
                          colors.textMuted
                        }
                      />

                      <Text
                        style={
                          styles.locationText
                        }
                        numberOfLines={1}
                      >
                        {
                          application.location
                        }
                      </Text>
                    </View>

                    {/* TYPE / SALARY */}
                    <View
                      style={
                        styles.bottomRow
                      }
                    >
                      <Text
                        style={
                          styles.typeText
                        }
                      >
                        {
                          application.type
                        }
                      </Text>

                      {application.salary ? (
                        <Text
                          style={
                            styles.salaryText
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {" · "}
                          {
                            application.salary
                          }
                        </Text>
                      ) : null}
                    </View>

                    {/* APPLIED LABEL */}
                    <View
                      style={
                        styles.appliedLabel
                      }
                    >
                      <Feather
                        name="check-circle"
                        size={14}
                        color="#16A34A"
                      />

                      <Text
                        style={
                          styles.appliedLabelText
                        }
                      >
                        Applied
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* CANCEL BUTTON */}
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      {
                        opacity:
                          isCancelling
                            ? 0.6
                            : 1,
                      },
                    ]}
                    onPress={() =>
                      handleCancelApplication(
                        application
                      )
                    }
                    disabled={
                      isCancelling
                    }
                    activeOpacity={0.85}
                  >
                    {isCancelling ? (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                      />
                    ) : (
                      <>
                        <Feather
                          name="x-circle"
                          size={15}
                          color="#fff"
                        />

                        <Text
                          style={
                            styles.cancelButtonText
                          }
                        >
                          Cancel Job
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }
          )}
        </View>
      )}
    </SafeScreen>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        colors.bg ||
        colors.background,
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
    },

    /*
     * HEADER
     */
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
      minHeight: 32,
      marginBottom: 6,
    },

    backIconBtn: {
      zIndex: 2,
    },

    headerTitle: {
      position: "absolute",
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
    },

    subtitle: {
      marginTop: 12,
      marginBottom: 16,
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      textAlign: "center",
    },

    /*
     * COUNT
     */
    countContainer: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginBottom: 18,
    },

    countText: {
      marginLeft: 7,
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
    },

    /*
     * LIST
     */
    list: {
      gap: 14,
    },

    /*
     * APPLICATION CARD
     */
    card: {
      backgroundColor:
        colors.card,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 18,
    },

    jobIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        (colors.primary ||
          "#8B5CF6") + "22",
      marginBottom: 12,
    },

    jobTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 6,
    },

    companyText: {
      fontSize: 14,
      fontWeight: "600",
      color:
        colors.primary ||
        "#8B5CF6",
      marginBottom: 8,
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 7,
    },

    locationText: {
      flex: 1,
      marginLeft: 6,
      color: colors.textMuted,
      fontSize: 13,
    },

    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
      marginBottom: 12,
    },

    typeText: {
      color:
        colors.primary ||
        "#8B5CF6",
      fontSize: 12,
      fontWeight: "700",
    },

    salaryText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 12,
    },

    /*
     * APPLIED LABEL
     */
    appliedLabel: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },

    appliedLabelText: {
      color: "#16A34A",
      fontSize: 12,
      fontWeight: "700",
      marginLeft: 5,
    },

    /*
     * CANCEL BUTTON
     */
    cancelButton: {
      width: "100%",
      height: 40,
      borderRadius: 9,
      backgroundColor: "#DC2626",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      marginTop: 2,
    },

    cancelButtonText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
      marginLeft: 6,
    },

    /*
     * EMPTY
     */
    emptyContainer: {
      padding: 35,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 8,
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      maxWidth: 280,
      marginBottom: 20,
    },

    browseButton: {
      backgroundColor:
        colors.primary ||
        "#8B5CF6",
      borderRadius: 11,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },

    browseButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },

    /*
     * LOADING
     */
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },

    loadingText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: "600",
    },
  });