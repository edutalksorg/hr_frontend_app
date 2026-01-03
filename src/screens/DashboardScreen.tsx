import React, { useState, FC } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout, Typography } from '../constants/Theme';
import {
    Clock,
    Calendar,
    Briefcase,
    CheckCircle,
    AlertCircle,
    Users,
    FileText,
    Bell,
    Settings,
    Shield,
    CreditCard,
    LogOut,
    PlayCircle,
    StopCircle,
    HelpCircle,
    FileCheck,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isDark = false; // Toggle this based on system theme or context
const theme = isDark ? Colors.dark : Colors.light;

interface DashboardScreenProps {
    role?: 'Employee' | 'HR' | 'Manager' | 'Marketing';
}

const DashboardScreen: FC<DashboardScreenProps> = ({ role = 'Employee' }) => {
    const [isShiftActive, setIsShiftActive] = useState(false);
    const [shiftDuration, setShiftDuration] = useState('00:00:00');

    const toggleShift = () => {
        setIsShiftActive(!isShiftActive);
        // Logic to start/stop timer would go here
    };

    const FeatureTile = ({ icon: Icon, label, onPress, color }: any) => (
        <TouchableOpacity
            style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.tileIconContainer, { backgroundColor: color + '20' }]}>
                <Icon size={24} color={color} />
            </View>
            <Text style={[styles.tileText, { color: theme.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    const StatCard = ({ icon: Icon, label, value, subtext, accentColor }: any) => (
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statHeader}>
                <View style={[styles.iconBox, { backgroundColor: accentColor + '20' }]}>
                    <Icon size={18} color={accentColor} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
            </View>
            <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>{label}</Text>
            {subtext && <Text style={[styles.statSubtext, { color: accentColor }]}>{subtext}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Top Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.roleBadge, { color: theme.primary, backgroundColor: theme.primary + '15' }]}>
                            {role.toUpperCase()} COMPLIANCE
                        </Text>
                        <Text style={[styles.welcomeText, { color: theme.text }]}>
                            Welcome back, John!
                        </Text>
                        <Text style={[styles.dateText, { color: theme.mutedForeground }]}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        {/* Avatar Placeholder */}
                        <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>
                            <Text style={styles.avatarText}>JD</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Shift Details Card (Hero) */}
                <View style={[styles.shiftCard, { backgroundColor: theme.primary }]}>
                    <View style={styles.shiftHeader}>
                        <View>
                            <Text style={styles.shiftTitle}>Morning Shift</Text>
                            <Text style={styles.shiftTime}>09:00 AM - 06:00 PM</Text>
                        </View>
                        <View style={styles.shiftStatusContainer}>
                            <Text style={styles.shiftStatusText}>
                                {isShiftActive ? 'ACTIVE' : 'UPCOMING'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{isShiftActive ? shiftDuration : '00:00:00'}</Text>
                        <Text style={styles.timerLabel}>Duration Worked</Text>
                    </View>

                    <View style={styles.shiftActions}>
                        <View style={styles.statusPill}>
                            <CheckCircle size={14} color="#fff" />
                            <Text style={styles.statusPillText}>On Time</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={toggleShift}
                            activeOpacity={0.9}
                        >
                            {isShiftActive ? (
                                <>
                                    <StopCircle size={20} color={theme.primary} />
                                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>Punch Out</Text>
                                </>
                            ) : (
                                <>
                                    <PlayCircle size={20} color={theme.primary} />
                                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>Punch In</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Overview Cards */}
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <StatCard
                            icon={Clock}
                            label="Attendance"
                            value="92%"
                            subtext="Excellent"
                            accentColor={theme.success}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <StatCard
                            icon={Calendar}
                            label="Leave Balance"
                            value="12 Days"
                            accentColor={theme.warning}
                        />
                    </View>
                </View>

                <View style={[styles.longCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.longCardHeader}>
                        <Briefcase size={20} color={theme.secondary} />
                        <Text style={[styles.longCardTitle, { color: theme.text }]}>Today's Goals</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { backgroundColor: theme.secondary, width: '65%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.mutedForeground }]}>3 of 5 tasks completed</Text>
                </View>


                {/* Feature Tiles Section */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
                <View style={styles.gridContainer}>
                    <FeatureTile icon={FileCheck} label="Attendance" color={theme.primary} onPress={() => { }} />
                    <FeatureTile icon={Users} label="Teams" color="#8B5CF6" onPress={() => { }} />
                    <FeatureTile icon={FileText} label="Payroll" color="#F43F5E" onPress={() => { }} />
                    <FeatureTile icon={Calendar} label="Holidays" color="#10B981" onPress={() => { }} />
                    <FeatureTile icon={HelpCircle} label="Support" color="#F59E0B" onPress={() => { }} />
                    <FeatureTile icon={Shield} label="Policies" color="#64748B" onPress={() => { }} />
                </View>

                {/* HR/Admin Enhanced View */}
                {(role === 'HR' || role === 'Manager') && (
                    <View style={styles.adminSection}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Management Overview</Text>

                        <View style={[styles.adminCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.adminRow}>
                                <View>
                                    <Text style={[styles.adminLabel, { color: theme.mutedForeground }]}>Workforce Active</Text>
                                    <Text style={[styles.adminValue, { color: theme.text }]}>142 / 180</Text>
                                </View>
                                <View style={[styles.adminRings, { borderColor: theme.success }]} />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.taskCard, { backgroundColor: theme.muted }]}>
                                <Text style={[styles.taskCount, { color: theme.primary }]}>8</Text>
                                <Text style={[styles.taskLabel, { color: theme.mutedForeground }]}>Pending Approvals</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.taskCard, { backgroundColor: theme.muted }]}>
                                <Text style={[styles.taskCount, { color: theme.error }]}>3</Text>
                                <Text style={[styles.taskLabel, { color: theme.mutedForeground }]}>Payroll Alerts</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Layout.padding,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    roleBadge: {
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        fontFamily: Typography.fontFamily,
        letterSpacing: 0.5,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 8,
        fontFamily: Typography.fontFamily,
    },
    dateText: {
        fontSize: 14,
        marginTop: 4,
        fontFamily: Typography.fontFamily,
    },
    profileButton: {
        padding: 4,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    shiftCard: {
        borderRadius: 20, // Modern large radius
        padding: 24,
        marginBottom: 24,
        shadowColor: '#0588F0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    shiftHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    shiftTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: Typography.fontFamily,
    },
    shiftTime: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginTop: 4,
        fontFamily: Typography.fontFamily,
    },
    shiftStatusContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    shiftStatusText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    timerText: {
        fontSize: 42,
        fontWeight: '700',
        color: '#FFF',
        fontVariant: ['tabular-nums'],
        fontFamily: Typography.fontFamily,
        letterSpacing: 2,
    },
    timerLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 4,
    },
    shiftActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 30,
        gap: 6,
    },
    statusPillText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    actionButton: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        fontWeight: '700',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    statCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        height: 110,
        justifyContent: 'space-between',
    },
    statHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconBox: {
        padding: 8,
        borderRadius: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: Typography.fontFamily,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    statSubtext: {
        fontSize: 11,
        fontWeight: '600',
    },
    longCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    longCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    longCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Typography.fontFamily,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        fontFamily: Typography.fontFamily,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    tile: {
        width: (width - Layout.padding * 2 - 12) / 2, // 2 column grid
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'flex-start',
        gap: 12,
    },
    tileIconContainer: {
        padding: 10,
        borderRadius: 12,
    },
    tileText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Typography.fontFamily,
    },
    adminSection: {
        marginTop: 8,
    },
    adminCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    adminRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    adminLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    adminValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    adminRings: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 4,
        opacity: 0.5,
    },
    taskCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    taskCount: {
        fontSize: 20,
        fontWeight: '700',
    },
    taskLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
});

export default DashboardScreen;
