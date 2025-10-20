import React, { useState, useRef, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StatusBar,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
  Modal,
  ScrollView,
  Platform
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AntDesign } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.75;

// Global handler moved to App.js

export default function HomeScreen({ 
  navigation, 
  tasks, 
  setTasks, 
  completedTasks, 
  setCompletedTasks,
  calendarTasks,
  setCalendarTasks,
  appSettings,
  setAppSettings
}) {
  const [task, setTask] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00'); // Default notification time
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Animation values
  const sidebarAnimation = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;

  // Initialize notifications
  useEffect(() => {
    setupNotifications();
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadStoredData();
  }, []);

  // Apply settings when they change
  useEffect(() => {
    if (appSettings) {
      if (appSettings.defaultReminderTime && appSettings.defaultReminderTime !== selectedTime) {
        setSelectedTime(appSettings.defaultReminderTime);
      }
    }
  }, [appSettings]);

  // Save data whenever tasks or calendar tasks change
  useEffect(() => {
    saveDataToStorage();
  }, [tasks, completedTasks, calendarTasks]);

  const setupNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Enable notifications to get reminders for your tasks!',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Respect app settings toggle as well
      if (appSettings?.notifications === false) {
        setNotificationsEnabled(false);
      } else {
        setNotificationsEnabled(true);
      }
    } else {
      Alert.alert('Notifications not supported on simulator');
    }
  };

  const scheduleNotification = async (taskTitle, taskDate, taskTime = selectedTime) => {
    if (!notificationsEnabled || appSettings?.notifications === false) return null;

    try {
      // Parse the date and time
      const [year, month, day] = taskDate.split('-').map(Number);
      const [hours, minutes] = taskTime.split(':').map(Number);
      
      const notificationDate = new Date(year, month - 1, day, hours, minutes);
      
      // Don't schedule if the date is in the past
      if (notificationDate <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📋 Task Reminder",
          body: `Don't forget: ${taskTitle}`,
          sound: appSettings?.soundEnabled !== false,
          priority: Notifications.AndroidImportance.HIGH,
        },
        trigger: {
          date: notificationDate,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const cancelNotification = async (notificationId) => {
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch (error) {
        console.error('Error canceling notification:', error);
      }
    }
  };

  const loadStoredData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedTasks = await AsyncStorage.getItem('tasks');
      const storedCompletedTasks = await AsyncStorage.getItem('completedTasks');
      const storedCalendarTasks = await AsyncStorage.getItem('calendarTasks');
      const storedNotificationSettings = await AsyncStorage.getItem('notificationSettings');
      
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
      if (storedCompletedTasks) {
        setCompletedTasks(JSON.parse(storedCompletedTasks));
      }
      if (storedCalendarTasks) {
        setCalendarTasks(JSON.parse(storedCalendarTasks));
      }
      if (storedNotificationSettings) {
        const settings = JSON.parse(storedNotificationSettings);
        setSelectedTime(settings.defaultTime || '09:00');
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      setError('Failed to load data. Please restart the app.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDataToStorage = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      await AsyncStorage.setItem('completedTasks', JSON.stringify(completedTasks));
      await AsyncStorage.setItem('calendarTasks', JSON.stringify(calendarTasks));
      await AsyncStorage.setItem('notificationSettings', JSON.stringify({
        defaultTime: selectedTime,
        enabled: notificationsEnabled
      }));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Generate next 7 days from today
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      let displayText;
      if (i === 0) {
        displayText = 'Today';
      } else if (i === 1) {
        displayText = 'Tomorrow';
      } else {
        displayText = dayNames[date.getDay()];
      }
      
      days.push({
        date: date.toISOString().split('T')[0],
        displayText: displayText,
        fullDate: `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`,
        dayName: dayNames[date.getDay()],
        isToday: i === 0,
        isTomorrow: i === 1
      });
    }
    
    return days;
  };

  // Generate time options
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

  const addTask = async () => {
    if (task.trim() !== "") {
      // Schedule notification
      const notificationId = await scheduleNotification(task, selectedDate, selectedTime);
      
      const newTask = { 
        id: Date.now().toString(), 
        title: task, 
        completed: false,
        dateCreated: selectedDate,
        reminderTime: selectedTime,
        notificationId: notificationId,
        createdAt: new Date()
      };
      
      // Add to regular tasks
      setTasks([...tasks, newTask]);
      
      // Also add to calendar tasks for the selected date
      const updatedCalendarTasks = { ...calendarTasks };
      if (!updatedCalendarTasks[selectedDate]) {
        updatedCalendarTasks[selectedDate] = [];
      }
      updatedCalendarTasks[selectedDate].push({
        ...newTask,
        fromHomeScreen: true
      });
      setCalendarTasks(updatedCalendarTasks);
      
      setTask("");
      
      // Show confirmation
      if (notificationId && notificationsEnabled) {
        const formattedTime = new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        Alert.alert(
          'Task Added!',
          `Reminder set for ${formatDate(selectedDate)} at ${formattedTime}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const deleteTask = async (id) => {
    // Find the task to get its notification ID
    const taskToDelete = tasks.find(task => task.id === id);
    
    // Cancel the notification if it exists
    if (taskToDelete && taskToDelete.notificationId) {
      await cancelNotification(taskToDelete.notificationId);
    }
    
    // Remove from regular tasks
    setTasks(tasks.filter((item) => item.id !== id));
    
    // Remove from calendar tasks if it exists there
    if (taskToDelete && taskToDelete.dateCreated && calendarTasks[taskToDelete.dateCreated]) {
      const updatedCalendarTasks = { ...calendarTasks };
      updatedCalendarTasks[taskToDelete.dateCreated] = updatedCalendarTasks[taskToDelete.dateCreated]
        .filter(task => task.id !== id);
      
      // Remove the date key if no tasks remain
      if (updatedCalendarTasks[taskToDelete.dateCreated].length === 0) {
        delete updatedCalendarTasks[taskToDelete.dateCreated];
      }
      
      setCalendarTasks(updatedCalendarTasks);
    }
  };

  const completeTask = async (id) => {
    const taskToComplete = tasks.find(task => task.id === id);
    if (taskToComplete) {
      // Cancel the notification since task is completed
      if (taskToComplete.notificationId) {
        await cancelNotification(taskToComplete.notificationId);
      }
      
      // Add to completed tasks
      setCompletedTasks([...completedTasks, { ...taskToComplete, completedAt: new Date() }]);
      
      // Remove from regular tasks
      setTasks(tasks.filter((item) => item.id !== id));
      
      // Update calendar tasks to mark as completed instead of removing
      if (taskToComplete.dateCreated && calendarTasks[taskToComplete.dateCreated]) {
        const updatedCalendarTasks = { ...calendarTasks };
        const calendarTaskIndex = updatedCalendarTasks[taskToComplete.dateCreated]
          .findIndex(task => task.id === id);
        
        if (calendarTaskIndex !== -1) {
          updatedCalendarTasks[taskToComplete.dateCreated][calendarTaskIndex] = {
            ...updatedCalendarTasks[taskToComplete.dateCreated][calendarTaskIndex],
            completed: true,
            completedAt: new Date()
          };
        }
        
        setCalendarTasks(updatedCalendarTasks);
      }
    }
  };

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnimation, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarVisible(false);
    });
  };

  const navigateToAllDone = () => {
    closeSidebar();
    navigation.navigate('AllDone');
  };

  const navigateToCalendar = () => {
    closeSidebar();
    navigation.navigate('Calendar');
  };

  const navigateToNotes = () => {
    closeSidebar();
    navigation.navigate('Notes');
  };

  const navigateToSettings = () => {
    closeSidebar();
    navigation.navigate('Settings');
  };

  const navigateToAbout = () => {
    closeSidebar();
    navigation.navigate('About');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const showTimePicker = () => {
    setTimePickerVisible(true);
  };

  const selectDate = (date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
  };

  const selectTime = (time) => {
    setSelectedTime(time);
    setTimePickerVisible(false);
  };

  const menuItems = [
    { id: '1', title: 'All Tasks', icon: 'checkcircleo', action: () => closeSidebar() },
    { id: '2', title: 'Completed Tasks', icon: 'checkcircle', action: navigateToAllDone },
    { id: '3', title: 'Calendar', icon: 'calendar', action: navigateToCalendar },
    { id: '4', title: 'Notes', icon: 'filetext1', action: navigateToNotes },
    { id: '5', title: 'Settings', icon: 'setting', action: navigateToSettings },
    { id: '6', title: 'About', icon: 'infocirlceo', action: navigateToAbout },
  ];

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity style={styles.menuItem} onPress={item.action}>
      <AntDesign name={item.icon} size={20} color="#fff" />
      <Text style={styles.menuItemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity 
        style={styles.completeButton}
        onPress={() => completeTask(item.id)}
      >
        <AntDesign name="checkcircleo" size={20} color="#666" />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={styles.taskText}>{item.title}</Text>
        <View style={styles.taskMeta}>
          {item.dateCreated && (
            <Text style={styles.taskDate}>📅 {formatDate(item.dateCreated)}</Text>
          )}
          {item.reminderTime && (
            <Text style={styles.taskTime}>
              🔔 {new Date(`2000-01-01T${item.reminderTime}`).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteTask(item.id)}
      >
        <AntDesign name="close" size={18} color="#000" />
      </TouchableOpacity>
    </View>
  );

  const renderDateOption = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.dateOption, 
        selectedDate === item.date && styles.selectedDateOption
      ]}
      onPress={() => selectDate(item.date)}
    >
      <Text style={[
        styles.dateOptionText,
        selectedDate === item.date && styles.selectedDateOptionText
      ]}>
        {item.displayText}
      </Text>
      <Text style={[
        styles.dateOptionSubtext,
        selectedDate === item.date && styles.selectedDateOptionSubtext
      ]}>
        {item.fullDate}
      </Text>
    </TouchableOpacity>
  );

  const renderTimeOption = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.timeOption, 
        selectedTime === item.value && styles.selectedTimeOption
      ]}
      onPress={() => selectTime(item.value)}
    >
      <Text style={[
        styles.timeOptionText,
        selectedTime === item.value && styles.selectedTimeOptionText
      ]}>
        {item.display}
      </Text>
    </TouchableOpacity>
  );

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStoredData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Header with Menu Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
            <AntDesign name="menu-fold" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>TO-DO</Text>
            <Text style={styles.subtitle}>Stay organized, stay focused</Text>
          </View>
        </View>

        {/* Task Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="What todo?"
              placeholderTextColor="#666"
              value={task}
              onChangeText={setTask}
              multiline={false}
            />
            <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
              <AntDesign name="calendar" size={14} color="#666" />
              <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeButton} onPress={showTimePicker}>
              <AntDesign name="clockcircleo" size={14} color="#666" />
              <Text style={styles.timeButtonText}>
                {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <AntDesign name="plus" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Task Counter */}
        {tasks.length > 0 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} remaining
            </Text>
          </View>
        )}

        {/* Task List */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={styles.emptyText}>All caught up!</Text>
              <Text style={styles.emptySubtext}>Add a task to get started</Text>
            </View>
          }
          style={styles.taskList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Date Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={datePickerVisible}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDatePickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <TouchableOpacity 
                    onPress={() => setDatePickerVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <AntDesign name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.optionsContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <FlatList
                    data={getNext7Days()}
                    keyExtractor={(item) => item.date}
                    renderItem={renderDateOption}
                    scrollEnabled={false}
                  />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={timePickerVisible}
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTimePickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Reminder Time</Text>
                  <TouchableOpacity 
                    onPress={() => setTimePickerVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <AntDesign name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.optionsContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <FlatList
                    data={getTimeOptions()}
                    keyExtractor={(item) => item.value}
                    renderItem={renderTimeOption}
                    scrollEnabled={false}
                  />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <Animated.View 
            style={[
              styles.overlay,
              {
                opacity: overlayAnimation,
              }
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar */}
      {sidebarVisible && (
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: sidebarAnimation }],
            }
          ]}
        >
          {/* Sidebar Header */}
          <View style={styles.sidebarHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeSidebar}>
              <AntDesign name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.sidebarTitle}>Menu</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            <FlatList
              data={menuItems}
              keyExtractor={(item) => item.id}
              renderItem={renderMenuItem}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Sidebar Footer */}
          <View style={styles.sidebarFooter}>
            <Text style={styles.footerText}>Task Manager v1.0</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  mainContent: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  menuButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "300",
    letterSpacing: 0.5,
  },
  inputSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#222",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontWeight: "400",
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#222",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 4,
  },
  dateButtonText: {
    color: "#666",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#222",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  timeButtonText: {
    color: "#666",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  counterContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  counterText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  taskItem: {
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  completeButton: {
    marginRight: 12,
    padding: 4,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDate: {
    color: "#666",
    fontSize: 11,
    fontWeight: "400",
    marginRight: 12,
  },
  taskTime: {
    color: "#666",
    fontSize: 11,
    fontWeight: "400",
  },
  deleteButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyIcon: {
    fontSize: 64,
    color: "#333",
    marginBottom: 20,
  },
  emptyText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 16,
    fontWeight: "400",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingHorizontal: 24,
  },
  dateOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#222',
  },
  selectedDateOption: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  dateOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedDateOptionText: {
    color: '#000',
  },
  dateOptionSubtext: {
    color: '#666',
    fontSize: 14,
    fontWeight: '400',
  },
  selectedDateOptionSubtext: {
    color: '#333',
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#222',
  },
  selectedTimeOption: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  timeOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedTimeOptionText: {
    color: '#000',
  },
  // Sidebar Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
    zIndex: 999,
    borderRightWidth: 1,
    borderRightColor: 'rgba(51, 51, 51, 0.5)',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 51, 51, 0.5)',
  },
  closeButton: {
    marginRight: 16,
    padding: 8,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 34, 34, 0.7)',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  sidebarFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 51, 51, 0.5)',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});