/**
 * AhorraTech - Fallback 404 Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No Encontrado', headerShown: false }} />
      <View style={styles.container}>
        <Feather name="alert-triangle" size={48} color={colors.status.warning} />
        <Text style={styles.title}>Ruta No Encontrada</Text>
        <Text style={styles.subtitle}>La pantalla solicitada no existe o ha sido movida.</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Volver al Panel de Control</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  link: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.brand.electricBlue,
  },
  linkText: {
    color: colors.text.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
