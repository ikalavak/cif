import React from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  StyleSheet, 
  Platform, 
  StatusBar 
} from 'react-native';

export default function SafeScreen({ 
  children, 
  style, 
  scroll = false, 
  contentContainerStyle 
}) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {scroll ? (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentContainerStyle}
          // The keyboard prop ensures the scroll view behaves nicely when typing
          keyboardShouldPersistTaps="handled"
          style={styles.innerContainer}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.innerContainer, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // Android does not support SafeAreaView out of the box, 
    // so we manually push the content down by the height of the status bar.
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  innerContainer: {
    flex: 1,
  }
});