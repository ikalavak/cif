import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SafeScreen({
  children,
  scroll = false,
  contentContainerStyle,
  style,
  edges = ['top', 'bottom'],
  ...rest
}) {
  const insets = useSafeAreaInsets();

  if (scroll) {
    return (
      <SafeAreaView style={[{ flex: 1 }, style]} edges={edges} {...rest}>
        <ScrollView
          contentContainerStyle={[{ paddingTop: insets.top, paddingBottom: insets.bottom }, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }, style]} edges={edges} {...rest}>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}
