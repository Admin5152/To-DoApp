import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal,
  FlatList,
  Linking
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";

const SETTINGS_STORAGE_KEY = '@app_settings';

export default function SettingsPage({ navigation, appSettings, setAppSettings }) {
  const [settings, setSettings] = useState(appSettings || {
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

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [fontSizePickerVisible, setFontSizePickerVisible] = useState(false);
  const [sortingPickerVisible, setSortingPickerVisible] = useState(false);
  const [weekStartPickerVisible, setWeekStartPickerVisible] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Sync with parent app settings when they change
  useEffect(() => {
    if (appSettings && JSON.stringify(appSettings) !== JSON.stringify(settings)) {
      setSettings(appSettings);
    }
  }, [appSettings]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Don't show error to user for settings, just use defaults
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      // Update parent app state
      if (setAppSettings) {
        setAppSettings(newSettings);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleNotificationToggle = async (value) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive task reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
    }
    updateSetting('notifications', value);
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your tasks, notes, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'tasks',
                'completedTasks',
                'calendarTasks',
                '@user_notes',
                SETTINGS_STORAGE_KEY
              ]);
              Alert.alert('Success', 'All data has been cleared');
              // Reset settings to default
              const defaultSettings = {
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
              };
              setSettings(defaultSettings);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const exportData = async () => {
    try {
      const tasks = await AsyncStorage.getItem('tasks');
      const completedTasks = await AsyncStorage.getItem('completedTasks');
      const notes = await AsyncStorage.getItem('@user_notes');
      
      const exportData = {
        tasks: tasks ? JSON.parse(tasks) : [],
        completedTasks: completedTasks ? JSON.parse(completedTasks) : [],
        notes: notes ? JSON.parse(notes) : [],
        exportDate: new Date().toISOString()
      };

      // In a real app, you'd implement actual export functionality
      Alert.alert(
        'Export Data',
        `Found:\n• ${exportData.tasks.length} active tasks\n• ${exportData.completedTasks.length} completed tasks\n• ${exportData.notes.length} notes\n\nExport functionality coming soon!`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const getTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        times.push({
          value: timeString,
          display: displayTime
        });
      }
    }
    return times;
  };

  const fontSizeOptions = [
    { value: 'small', display: 'Small' },
    { value: 'medium', display: 'Medium' },
    { value: 'large', display: 'Large' }
  ];

  const sortingOptions = [
    { value: 'date', display: 'By Date Created' },
    { value: 'alphabetical', display: 'Alphabetical' },
    { value: 'priority', display: 'By Priority' }
  ];

  const weekStartOptions = [
    { value: 'sunday', display: 'Sunday' },
    { value: 'monday', display: 'Monday' }
  ];

  const renderSettingItem = ({ icon, title, description, rightComponent, onPress, showArrow = false }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress && !showArrow}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && (
          <AntDesign name="right" size={16} color="#666" style={{ marginLeft: 8 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderModalOption = (item, selectedValue, onSelect) => (
    <TouchableOpacity 
      style={[
        styles.modalOption,
        selectedValue === item.value && styles.selectedModalOption
      ]}
      onPress={() => onSelect(item.value)}
    >
      <Text style={[
        styles.modalOptionText,
        selectedValue === item.value && styles.selectedModalOptionText
      ]}>
        {item.display}
      </Text>
      {selectedValue === item.value && (
        <AntDesign name="check" size={16} color="#000" />
      )}
    </TouchableOpacity>
  );

  const SettingsModal = ({ visible, title, data, selectedValue, onSelect, onClose }) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {data.map((item) => (
              <View key={item.value}>
                {renderModalOption(item, selectedValue, (value) => {
                  onSelect(value);
                  onClose();
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            {renderSettingItem({
              icon: <AntDesign name="notification" size={20} color="#fff" />,
              title: "Push Notifications",
              description: "Receive task reminders",
              rightComponent: (
                <Switch
                  value={settings.notifications}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: "#333", true: "#fff" }}
                  thumbColor={settings.notifications ? "#000" : "#666"}
                />
              )
            })}

            {renderSettingItem({
              icon: <AntDesign name="sound" size={20} color="#fff" />,
              title: "Sound",
              description: "Play sound for notifications",
              rightComponent: (
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ false: "#333", true: "#fff" }}
                  thumbColor={settings.soundEnabled ? "#000" : "#666"}
                  disabled={!settings.notifications}
                />
              )
            })}

            {renderSettingItem({
              icon: <MaterialIcons name="vibration" size={20} color="#fff" />,
              title: "Vibration",
              description: "Vibrate for notifications",
              rightComponent: (
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => updateSetting('vibrationEnabled', value)}
                  trackColor={{ false: "#333", true: "#fff" }}
                  thumbColor={settings.vibrationEnabled ? "#000" : "#666"}
                  disabled={!settings.notifications}
                />
              )
            })}

            {renderSettingItem({
              icon: <AntDesign name="clockcircleo" size={20} color="#fff" />,
              title: "Default Reminder Time",
              description: new Date(`2000-01-01T${settings.defaultReminderTime}`).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              onPress: () => setTimePickerVisible(true),
              showArrow: true
            })}
          </View>

          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            
            {renderSettingItem({
              icon: <AntDesign name="eye" size={20} color="#fff" />,
              title: "Dark Mode",
              description: "Use dark theme",
              rightComponent: (
                <Switch
                  value={settings.darkMode}
                  onValueChange={(value) => updateSetting('darkMode', value)}
                  trackColor={{ false: "#333", true: "#fff" }}
                  thumbColor={settings.darkMode ? "#000" : "#666"}
                />
              )
            })}

            {renderSettingItem({
              icon: <AntDesign name="fontsize" size={20} color="#fff" />,
              title: "Font Size",
              description: fontSizeOptions.find(f => f.value === settings.fontSize)?.display,
              onPress: () => setFontSizePickerVisible(true),
              showArrow: true
            })}
          </View>

          {/* Behavior Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Behavior</Text>
            
            {renderSettingItem({
              icon: <AntDesign name="delete" size={20} color="#fff" />,
              title: "Auto-delete Completed",
              description: "Automatically delete completed tasks after 7 days",
              rightComponent: (
                <Switch
                  value={settings.autoDeleteCompleted}
                  onValueChange={(value) => updateSetting('autoDeleteCompleted', value)}
                  trackColor={{ false: "#333", true: "#fff" }}
                  thumbColor={settings.autoDeleteCompleted ? "#000" : "#666"}
                />
              )
            })}

            {renderSettingItem({
              icon: <AntDesign name="bars" size={20} color="#fff" />,
              title: "Task Sorting",
              description: sortingOptions.find(s => s.value === settings.taskSorting)?.display,
              onPress: () => setSortingPickerVisible(true),
              showArrow: true
            })}

            {renderSettingItem({
              icon: <AntDesign name="calendar" size={20} color="#fff" />,
              title: "Week Starts On",
              description: weekStartOptions.find(w => w.value === settings.weekStartsOn)?.display,
              onPress: () => setWeekStartPickerVisible(true),
              showArrow: true
            })}

            {renderSettingItem({
              icon: <AntDesign name="dashboard" size={20} color="#fff" />,
              title: "Show Task Counter",
              description: "Display remaining task count",
              rightComponent: (
                <Switch
                  value={settings.showTaskCounter}
                  onValueChange={(value) => updateSetting('showTaskCounter', value)}
                  trackColor={{ false: "#333", true: "#fff" }}
                  thumbColor={settings.showTaskCounter ? "#000" : "#666"}
                />
              )
            })}

            {renderSettingItem({
              icon: <AntDesign name="exclamationcircleo" size={20} color="#fff" />,
              title: "Confirm Before Delete",
              description: "Ask for confirmation before deleting tasks",
              rightComponent: (
                <Switch
                  value={settings.confirmDelete}
                  onValueChange={(value) => updateSetting('confirmDelete', value)}
                  trackColor={{ false: "#333", true: "#fff" }}
                  thumbColor={settings.confirmDelete ? "#000" : "#666"}
                />
              )
            })}
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            {renderSettingItem({
              icon: <AntDesign name="export" size={20} color="#4CAF50" />,
              title: "Export Data",
              description: "Export your tasks and notes",
              onPress: exportData,
              showArrow: true
            })}

            {renderSettingItem({
              icon: <AntDesign name="warning" size={20} color="#f44336" />,
              title: "Clear All Data",
              description: "Delete all tasks, notes, and settings",
              onPress: clearAllData,
              showArrow: true
            })}
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            {renderSettingItem({
              icon: <AntDesign name="infocirlceo" size={20} color="#fff" />,
              title: "App Version",
              description: "1.0.0"
            })}

            {renderSettingItem({
              icon: <AntDesign name="heart" size={20} color="#ff4444" />,
              title: "Rate App",
              description: "Share your feedback",
              onPress: () => Alert.alert('Thank you!', 'Rating feature coming soon!'),
              showArrow: true
            })}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Task Manager © 2025</Text>
          </View>
        </ScrollView>

        {/* Modals */}
        <SettingsModal
          visible={timePickerVisible}
          title="Default Reminder Time"
          data={getTimeOptions()}
          selectedValue={settings.defaultReminderTime}
          onSelect={(value) => updateSetting('defaultReminderTime', value)}
          onClose={() => setTimePickerVisible(false)}
        />

        <SettingsModal
          visible={fontSizePickerVisible}
          title="Font Size"
          data={fontSizeOptions}
          selectedValue={settings.fontSize}
          onSelect={(value) => updateSetting('fontSize', value)}
          onClose={() => setFontSizePickerVisible(false)}
        />

        <SettingsModal
          visible={sortingPickerVisible}
          title="Task Sorting"
          data={sortingOptions}
          selectedValue={settings.taskSorting}
          onSelect={(value) => updateSetting('taskSorting', value)}
          onClose={() => setSortingPickerVisible(false)}
        />

        <SettingsModal
          visible={weekStartPickerVisible}
          title="Week Starts On"
          data={weekStartOptions}
          selectedValue={settings.weekStartsOn}
          onSelect={(value) => updateSetting('weekStartsOn', value)}
          onClose={() => setWeekStartPickerVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalBody: {
    paddingVertical: 8,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  selectedModalOption: {
    backgroundColor: '#fff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#fff',
  },
  selectedModalOptionText: {
    color: '#000',
    fontWeight: '500',
  },
});