import React, { useState } from "react";
import { View, Text, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import AllDoneScreen from "./screens/AllDoneScreen";
import CalendarScreen from "./screens/CalendarScreen";
import NotesScreen from "./screens/NotesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import AboutScreen from "./screens/AboutScreen";
import ErrorBoundary from "./components/ErrorBoundary";

const Stack = createNativeStackNavigator();

export default function App() {
  // Main app state
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [appSettings, setAppSettings] = useState({
    notifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    defaultReminderTime: '09:00',
    autoDeleteCompleted: false,
    darkMode: true,
    fontSize: 'medium',
    taskSorting: 'date',
    showTaskCounter: true,
    confirmDelete: true,
    weekStartsOn: 'sunday'
  });

  // Initialize app
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Configure global notification handler once
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Ask permissions on real devices
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          // Create Android channel so scheduled notifications actually display
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'Default',
              importance: Notifications.AndroidImportance.HIGH,
              sound: appSettings.soundEnabled !== false ? 'default' : undefined,
              vibrationPattern: appSettings.vibrationEnabled !== false ? [0, 250, 250, 250] : undefined,
              enableVibrate: appSettings.vibrationEnabled !== false,
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              bypassDnd: false,
            });
          }
        }

        // Load persisted settings if any
        const savedSettings = await AsyncStorage.getItem('@app_settings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            setAppSettings(prev => ({ ...prev, ...parsed }));
          } catch (e) {
            // ignore malformed settings
          }
        }
        // Add a small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  // Persist settings when they change (source of truth in root)
  React.useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem('@app_settings', JSON.stringify(appSettings));
        if (Platform.OS === 'android') {
          // Update channel when sound/vibration settings change
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.HIGH,
            sound: appSettings.soundEnabled !== false ? 'default' : undefined,
            vibrationPattern: appSettings.vibrationEnabled !== false ? [0, 250, 250, 250] : undefined,
            enableVibrate: appSettings.vibrationEnabled !== false,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: false,
          });
        }
      } catch (e) {
        // ignore persistence errors
      }
    };
    persist();
  }, [appSettings]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 200
          }}
          initialRouteName="Home"
        >
        {/* Home Screen */}
        <Stack.Screen name="Home">
          {(props) => (
            <HomeScreen
              {...props}
              tasks={tasks}
              setTasks={setTasks}
              completedTasks={completedTasks}
              setCompletedTasks={setCompletedTasks}
              calendarTasks={calendarTasks}
              setCalendarTasks={setCalendarTasks}
              appSettings={appSettings}
              setAppSettings={setAppSettings}
            />
          )}
        </Stack.Screen>

        {/* All Done Screen */}
        <Stack.Screen name="AllDone">
          {(props) => (
            <AllDoneScreen 
              {...props} 
              completedTasks={completedTasks}
              setCompletedTasks={setCompletedTasks}
              appSettings={appSettings}
            />
          )}
        </Stack.Screen>

        {/* Calendar Screen */}
        <Stack.Screen name="Calendar">
          {(props) => (
            <CalendarScreen
              {...props}
              tasks={tasks}
              setTasks={setTasks}
              calendarTasks={calendarTasks}
              setCalendarTasks={setCalendarTasks}
              completedTasks={completedTasks}
              setCompletedTasks={setCompletedTasks}
              appSettings={appSettings}
            />
          )}
        </Stack.Screen>

        {/* Notes Screen */}
        <Stack.Screen name="Notes">
          {(props) => (
            <NotesScreen
              {...props}
              appSettings={appSettings}
            />
          )}
        </Stack.Screen>

        {/* Settings Screen */}
        <Stack.Screen name="Settings">
          {(props) => (
            <SettingsScreen
              {...props}
              appSettings={appSettings}
              setAppSettings={setAppSettings}
              tasks={tasks}
              setTasks={setTasks}
              completedTasks={completedTasks}
              setCompletedTasks={setCompletedTasks}
              calendarTasks={calendarTasks}
              setCalendarTasks={setCalendarTasks}
            />
          )}
        </Stack.Screen>

        {/* About Screen */}
        <Stack.Screen name="About">
          {(props) => (
            <AboutScreen
              {...props}
              appSettings={appSettings}
            />
          )}
        </Stack.Screen>
              </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}