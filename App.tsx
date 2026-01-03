import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import DashboardScreen from './src/screens/DashboardScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { Colors } from './src/constants/Theme';

// Define the navigation param list
export type RootStackParamList = {
    Welcome: undefined;
    Dashboard: { role?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    // Mocking loaded state for now to allow running without the font file
    const fontsLoaded = true;

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Welcome"
                    screenOptions={{
                        headerShown: false,
                        animation: 'fade',
                        contentStyle: { backgroundColor: Colors.light.background }
                    }}
                >
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen
                        name="Dashboard"
                        component={DashboardScreen}
                        initialParams={{ role: 'Employee' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
});
