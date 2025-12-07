import React from 'react';
import { StatusBar, View, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Wallet, PieChart, Briefcase, QrCode, ShoppingBag } from 'lucide-react-native';

import HomeScreen from './HomeScreen';
import SendScreen from './SendScreen';
import GigsScreen from './GigsScreen';
import SplitBillScreen from './SplitBillScreen';
import DaretScreen from './DaretScreen';
import WalletsScreen from './WalletsScreen';
import WalletDetailsScreen from './WalletDetailsScreen';
import AnalyticsScreen from './AnalyticsScreen';
import MapScreen from './MapScreen'; // Import MapScreen
import ContactsScreen from './ContactsScreen'; // Import ContactsScreen
import ShopScreen from './ShopScreen'; // Import ShopScreen

import ContactDetailsScreen from './ContactDetailsScreen'; // Import ContactDetailsScreen
import QRScannerScreen from './QRScannerScreen'; // Import QRScannerScreen
import ReceiveScreen from './ReceiveScreen'; // Import ReceiveScreen
import NotificationsScreen from './NotificationsScreen'; // Import NotificationsScreen
import { COLORS, THEME } from './constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }) => (
    <TouchableOpacity
        style={{
            top: -20,
            justifyContent: 'center',
            alignItems: 'center',
        }}
        onPress={onPress}
    >
        <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: COLORS.primary,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: COLORS.background,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
        }}>
            {children}
        </View>
    </TouchableOpacity>
);

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.cardBg,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="WalletsTab"
                component={WalletsScreen}
                options={{
                    tabBarLabel: 'Wallets',
                    tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="PayTab"
                component={QRScannerScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <QrCode color="#FFFFFF" size={28} />
                    ),
                    tabBarButton: (props) => (
                        <CustomTabBarButton {...props} />
                    ),
                    tabBarLabel: () => null,
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('QRScanner');
                    },
                })}
            />
            <Tab.Screen
                name="AnalyticsTab"
                component={AnalyticsScreen}
                options={{
                    tabBarLabel: 'Analytics',
                    tabBarIcon: ({ color, size }) => <PieChart color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="GigsTab"
                component={GigsScreen}
                options={{
                    tabBarLabel: 'Earn',
                    tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <NavigationContainer theme={THEME}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.background },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="Send" component={SendScreen} />
                <Stack.Screen name="SplitBill" component={SplitBillScreen} />
                <Stack.Screen name="Daret" component={DaretScreen} />
                {/* Gigs is now in Tabs, but we keep it here if we want to push it from Home too, 
            though usually we'd just navigate to the Tab */}
                <Stack.Screen name="Gigs" component={GigsScreen} />
                <Stack.Screen name="Contacts" component={ContactsScreen} />
                <Stack.Screen name="Map" component={MapScreen} />
                <Stack.Screen name="ContactDetails" component={ContactDetailsScreen} />
                <Stack.Screen name="QRScanner" component={QRScannerScreen} />
                <Stack.Screen name="Receive" component={ReceiveScreen} />
                <Stack.Screen name="WalletDetails" component={WalletDetailsScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="ShopTab" component={ShopScreen} />
                <Stack.Screen name="Shop" component={ShopScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
