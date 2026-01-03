import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { Colors, Typography, Layout } from '../constants/Theme';

const { width } = Dimensions.get('window');

// In a real app, you might use a local asset or a high-quality remote URL
// For this demo, using a placeholder gradient/abstract image concept unless actual assets exist.
// We'll simulate a premium background with styling.

const WelcomeScreen = ({ navigation }: any) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Branding / Logo Area */}
                <View style={styles.header}>
                    <View style={styles.logoBadge}>
                        <Sparkles size={32} color={Colors.light.primary} />
                    </View>
                    <Text style={styles.appName}>EduTalks HR</Text>
                </View>

                {/* Main Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.title}>
                        Manage Your{"\n"}
                        Work Life{"\n"}
                        <Text style={styles.titleHighlight}>Seamlessly</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Track attendance, manage shifts, and stay connected with your team in one unified platform.
                    </Text>
                </View>

                {/* Action Area */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.button}
                        activeOpacity={0.8}
                        onPress={() => navigation.replace('Dashboard')}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                        <ArrowRight size={20} color="#FFF" />
                    </TouchableOpacity>

                    <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    content: {
        flex: 1,
        padding: Layout.padding,
        justifyContent: 'space-between',
    },
    header: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoBadge: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: Colors.light.primary + '15', // 15% opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        fontFamily: Typography.fontFamily,
        letterSpacing: -0.5,
    },
    heroSection: {
        flex: 1,
        justifyContent: 'center',
        gap: 16,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: Colors.light.text,
        lineHeight: 52,
        fontFamily: Typography.fontFamily,
        letterSpacing: -1,
    },
    titleHighlight: {
        color: Colors.light.primary,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.mutedForeground,
        lineHeight: 26,
        maxWidth: '90%',
        fontFamily: Typography.fontFamily,
    },
    footer: {
        gap: 20,
        marginBottom: 20,
    },
    button: {
        backgroundColor: Colors.light.primary,
        flexDirection: 'row',
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: Typography.fontFamily,
    },
    versionText: {
        textAlign: 'center',
        color: Colors.light.mutedForeground,
        fontSize: 12,
    },
});

export default WelcomeScreen;
