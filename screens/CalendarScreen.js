import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Alert
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Calendar } from "react-native-calendars";
import { AntDesign } from "@expo/vector-icons";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Storage keys
const TASKS_STORAGE_KEY = '@calendar_tasks';
const SELECTED_DATE_STORAGE_KEY = '@selected_date';

export default function CalendarViewScreen({ navigation, tasks: mainTasks, setTasks: setMainTasks, calendarTasks, setCalendarTasks, completedTasks, setCompletedTasks, appSettings }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [localTasks, setLocalTasks] = useState({});
  const [newTask, setNewTask] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from storage when component mounts
  useEffect(() => {
    loadStoredData();
  }, []);

  // Sync with main app state when calendarTasks change
  useEffect(() => {
    if (calendarTasks && Object.keys(calendarTasks).length > 0) {
      setLocalTasks(calendarTasks);
    }
  }, [calendarTasks]);

  // Save tasks to storage whenever localTasks state changes
  useEffect(() => {
    if (!isLoading) {
      saveTasks();
    }
  }, [localTasks, isLoading]);

  // Save selected date to storage whenever it changes
  useEffect(() => {
    if (!isLoading && selectedDate) {
      saveSelectedDate();
    }
  }, [selectedDate, isLoading]);

  const loadStoredData = async () => {
    try {
      setError(null);
      
      // Load tasks
      const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setLocalTasks(parsedTasks);
      }

      // Load selected date
      const storedDate = await AsyncStorage.getItem(SELECTED_DATE_STORAGE_KEY);
      if (storedDate) {
        setSelectedDate(storedDate);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(localTasks));
      // Update main app state
      if (setCalendarTasks) {
        setCalendarTasks(localTasks);
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
      Alert.alert('Error', 'Failed to save tasks');
    }
  };

  const saveSelectedDate = async () => {
    try {
      await AsyncStorage.setItem(SELECTED_DATE_STORAGE_KEY, selectedDate);
    } catch (error) {
      console.error('Error saving selected date:', error);
    }
  };

  const scheduleNotificationForDate = async (taskTitle, dateString, timeString) => {
    try {
      if (appSettings?.notifications === false) return null;
      if (!dateString || !timeString) return null;
      const [year, month, day] = dateString.split('-').map(Number);
      const [hours, minutes] = timeString.split(':').map(Number);
      const triggerDate = new Date(year, month - 1, day, hours, minutes);
      if (triggerDate <= new Date()) return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Task Reminder',
          body: `Don't forget: ${taskTitle}`,
          sound: appSettings?.soundEnabled !== false,
          priority: Notifications.AndroidImportance.HIGH,
        },
        trigger: { date: triggerDate },
      });
      return notificationId;
    } catch (e) {
      console.error('Error scheduling calendar notification:', e);
      return null;
    }
  };

  const cancelNotificationIfAny = async (notificationId) => {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.error('Error cancelling calendar notification:', e);
    }
  };

  const addTaskForDate = async () => {
    if (!newTask.trim() || !selectedDate) return;
    
    const updatedTasks = { ...localTasks };
    if (!updatedTasks[selectedDate]) updatedTasks[selectedDate] = [];
    
    const generatedId = Date.now().toString();
    const reminderTime = appSettings?.defaultReminderTime || '09:00';
    const notificationId = await scheduleNotificationForDate(newTask.trim(), selectedDate, reminderTime);

    const newTaskObj = { 
      id: generatedId, 
      title: newTask.trim(),
      createdAt: new Date().toISOString(),
      completed: false,
      fromCalendar: true,
      dateCreated: selectedDate,
      reminderTime: reminderTime,
      notificationId: notificationId,
    };
    
    updatedTasks[selectedDate].push(newTaskObj);
    setLocalTasks(updatedTasks);
    
    // Also add to main tasks if it's today
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today && setMainTasks) {
      const mainTaskObj = {
        ...newTaskObj,
      };
      setMainTasks(prev => [...prev, mainTaskObj]);
    }
    
    setNewTask("");
  };

  const deleteTask = async (date, id) => {
    const updatedTasks = { ...localTasks };
    const taskToDelete = (updatedTasks[date] || []).find(task => task.id === id);
    if (taskToDelete?.notificationId) {
      await cancelNotificationIfAny(taskToDelete.notificationId);
    }
    updatedTasks[date] = (updatedTasks[date] || []).filter(task => task.id !== id);
    
    if (updatedTasks[date].length === 0) {
      delete updatedTasks[date];
    }
    
    setLocalTasks(updatedTasks);
    
    // Also remove from main tasks if it exists there
    if (setMainTasks) {
      setMainTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  const completeTask = async (date, id) => {
    const updatedTasks = { ...localTasks };
    const taskIndex = updatedTasks[date].findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
      const task = updatedTasks[date][taskIndex];
      const isCompleted = !task.completed;
      
      if (isCompleted && task.notificationId) {
        await cancelNotificationIfAny(task.notificationId);
      }

      updatedTasks[date][taskIndex] = {
        ...task,
        completed: isCompleted
      };
      setLocalTasks(updatedTasks);
      
      // If completing, add to completed tasks
      if (isCompleted && setCompletedTasks) {
        setCompletedTasks(prev => [...prev, { ...task, completed: true, completedAt: new Date() }]);
      }
      
      // Update main tasks if it exists there
      if (setMainTasks) {
        setMainTasks(prev => prev.map(t => 
          t.id === id ? { ...t, completed: isCompleted } : t
        ));
      }
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all calendar tasks? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([TASKS_STORAGE_KEY, SELECTED_DATE_STORAGE_KEY]);
              setLocalTasks({});
              setSelectedDate("");
              
              // Also clear from main app state
              if (setCalendarTasks) {
                setCalendarTasks({});
              }
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getTaskCount = (date) => {
    return localTasks[date] ? localTasks[date].length : 0;
  };

  const getCompletedTaskCount = (date) => {
    return localTasks[date] ? localTasks[date].filter(task => task.completed).length : 0;
  };

  // Create marked dates object
  const markedDates = Object.keys(localTasks).reduce((acc, date) => {
    const taskCount = getTaskCount(date);
    const completedCount = getCompletedTaskCount(date);
    const hasAllCompleted = taskCount > 0 && completedCount === taskCount;
    
    acc[date] = { 
      marked: true, 
      dotColor: hasAllCompleted ? "#4CAF50" : "#fff",
      customStyles: {
        container: {
          backgroundColor: taskCount > 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          borderRadius: 16
        },
        text: {
          color: '#fff',
          fontWeight: taskCount > 0 ? 'bold' : 'normal'
            }
          }
        };
        return acc;
      }, {});

  // Mark selected date
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "#fff",
      selectedTextColor: "#000",
      customStyles: {
        container: {
          backgroundColor: '#fff',
          borderRadius: 16
        },
        text: {
          color: '#000',
          fontWeight: 'bold'
        }
      }
    };
  }

  const renderTaskItem = ({ item }) => (
    <View style={[styles.taskItem, item.completed && styles.completedTask]}>
      <TouchableOpacity 
        style={styles.completeButton}
        onPress={() => completeTask(selectedDate, item.id)}
      >
        <AntDesign 
          name={item.completed ? "checkcircle" : "checkcircleo"} 
          size={20} 
          color={item.completed ? "#4CAF50" : "#666"} 
        />
      </TouchableOpacity>
      <Text style={[styles.taskText, item.completed && styles.completedTaskText]}>
        {item.title}
      </Text>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteTask(selectedDate, item.id)}
      >
        <AntDesign name="close" size={16} color="#000" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStoredData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAllData}
          >
            <AntDesign name="delete" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Calendar */}
          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              theme={{
                backgroundColor: "#000",
                calendarBackground: "transparent",
                dayTextColor: "#fff",
                monthTextColor: "#fff",
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
                arrowColor: "#fff",
                todayTextColor: "#fff",
                textDisabledColor: "#333",
                selectedDayBackgroundColor: "#fff",
                selectedDayTextColor: "#000",
                dotColor: "#fff",
                selectedDotColor: "#000",
                arrowHeight: 20,
                arrowWidth: 20,
                'stylesheet.calendar.header': {
                  week: {
                    marginTop: 7,
                    marginHorizontal: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-around'
                  }
                },
                'stylesheet.day.basic': {
                  base: {
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }
              }}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              markingType="custom"
              firstDay={1}
              hideExtraDays={true}
              disableMonthChange={false}
              hideDayNames={false}
              showWeekNumbers={false}
              disableArrowLeft={false}
              disableArrowRight={false}
            />
          </View>

          {/* Task Section */}
          {selectedDate && (
            <View style={styles.taskSection}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateTitle}>
                  {formatDate(selectedDate)}
                </Text>
                <View style={styles.taskCounter}>
                  <Text style={styles.taskCountText}>
                    {getCompletedTaskCount(selectedDate)}/{getTaskCount(selectedDate)} {getTaskCount(selectedDate) === 1 ? 'task' : 'tasks'}
                  </Text>
                </View>
              </View>

              {/* Add Task Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="What do you want to do on this day?"
                  placeholderTextColor="#666"
                  value={newTask}
                  onChangeText={setNewTask}
                  multiline={false}
                  returnKeyType="done"
                  onSubmitEditing={addTaskForDate}
                />
                <TouchableOpacity 
                  style={[styles.addButton, !newTask.trim() && styles.addButtonDisabled]} 
                  onPress={addTaskForDate}
                  disabled={!newTask.trim()}
                >
                  <AntDesign name="plus" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Tasks List */}
              <View style={styles.tasksContainer}>
                {localTasks[selectedDate] && localTasks[selectedDate].length > 0 ? (
                  <FlatList
                    data={localTasks[selectedDate]}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTaskItem}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📅</Text>
                    <Text style={styles.emptyText}>No plans yet</Text>
                    <Text style={styles.emptySubtext}>Add a task to get started</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {!selectedDate && (
            <View style={styles.selectDateContainer}>
              <Text style={styles.selectDateIcon}>🗓️</Text>
              <Text style={styles.selectDateText}>
                {Object.keys(localTasks).length > 0 ? 'Welcome back!' : 'Select a date'}
              </Text>
              <Text style={styles.selectDateSubtext}>
                {Object.keys(localTasks).length > 0 
                  ? `You have tasks on ${Object.keys(localTasks).length} ${Object.keys(localTasks).length === 1 ? 'day' : 'days'}`
                  : 'Tap on any date to view or add tasks'
                }
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  clearButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  calendarContainer: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  calendar: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  taskSection: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  taskCounter: {
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  taskCountText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  input: { 
    flex: 1,
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
  },
  addButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  addButtonDisabled: {
    backgroundColor: "#333",
    opacity: 0.5,
  },
  tasksContainer: {
    flex: 1,
    minHeight: 200,
  },
  taskItem: {
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  completedTask: {
    opacity: 0.7,
    backgroundColor: '#0a0a0a',
  },
  completeButton: {
    marginRight: 12,
    padding: 4,
  },
  taskText: { 
    color: "#fff",
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
    lineHeight: 22,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  deleteButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  selectDateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  selectDateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  selectDateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectDateSubtext: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Error States
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