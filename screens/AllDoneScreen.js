import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, FlatList, StatusBar, Alert } from "react-native";
import { AntDesign } from "@expo/vector-icons";

export default function AllDoneScreen({ navigation, completedTasks, setCompletedTasks, appSettings }) {
  const renderItem = ({ item }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskContent}>
        <Text style={styles.taskText}>{item.title}</Text>
        {item.dateCreated && (
          <Text style={styles.taskDate}>📅 {formatDate(item.dateCreated)}</Text>
        )}
        {item.completedAt && (
          <Text style={styles.completedDate}>✅ Completed {formatDate(item.completedAt)}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteCompletedTask(item.id)}
      >
        <AntDesign name="delete" size={18} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

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

  const deleteCompletedTask = (id) => {
    if (appSettings?.confirmDelete) {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this completed task?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              if (setCompletedTasks) {
                setCompletedTasks(prev => prev.filter(task => task.id !== id));
              }
            }
          }
        ]
      );
    } else {
      if (setCompletedTasks) {
        setCompletedTasks(prev => prev.filter(task => task.id !== id));
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>ALL DONE</Text>
      </View>

      <FlatList
        data={completedTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completed tasks yet</Text>
          </View>
        }
        style={styles.taskList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, marginBottom: 20, gap: 10 },
  title: { fontSize: 24, fontWeight: "900", color: "#fff" },
  taskList: { paddingHorizontal: 24 },
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
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskText: { 
    color: "#aaa", 
    fontSize: 16, 
    textDecorationLine: "line-through",
    marginBottom: 6,
  },
  taskDate: {
    color: "#666",
    fontSize: 12,
    marginBottom: 4,
  },
  completedDate: {
    color: "#4CAF50",
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#666", fontSize: 18 }
});
