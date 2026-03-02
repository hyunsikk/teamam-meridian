import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { NavigationContainer } from './src/navigation/NavigationContainer';
import { DataProvider } from './src/context/DataContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <DataProvider>
      <StatusBar style="light" />
      <NavigationContainer />
    </DataProvider>
  );
}
