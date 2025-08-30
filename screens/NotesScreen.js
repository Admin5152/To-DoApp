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
  Alert 
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather } from "@expo/vector-icons";
import { useFonts, IndieFlower_400Regular } from "@expo-google-fonts/indie-flower";

const NOTES_STORAGE_KEY = '@user_notes';

export default function NotesPage({ navigation, appSettings }) {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    IndieFlower_400Regular
  });

  // Load notes from storage when component mounts
  useEffect(() => {
    loadNotes();
  }, []);

  // Load notes from AsyncStorage
  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes !== null) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      // Don't show alert, just log error and continue with empty notes
    } finally {
      setIsLoading(false);
    }
  };

  // Save notes to AsyncStorage
  const saveNotesToStorage = async (notesToSave) => {
    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesToSave));
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes to storage');
    }
  };

  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingContainer]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const saveNote = async () => {
    if (!noteText.trim()) return;
    
    let updatedNotes;
    
    if (editingId) {
      // Update existing note
      updatedNotes = notes.map((note) =>
        note.id === editingId ? { ...note, text: noteText, updatedAt: new Date().toISOString() } : note
      );
      setEditingId(null);
    } else {
      // Add new note
      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedNotes = [...notes, newNote];
    }
    
    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes);
    setNoteText("");
  };

  const deleteNote = async (id) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes);
    
    if (editingId === id) {
      setEditingId(null);
      setNoteText("");
    }
  };

  const startEditing = (note) => {
    setNoteText(note.text);
    setEditingId(note.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNoteText("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.header}>My Notes & Ideas</Text>

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write something..."
            placeholderTextColor="#888"
            value={noteText}
            onChangeText={setNoteText}
            multiline
          />
          <View style={styles.buttonContainer}>
            {editingId && (
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
                <AntDesign name="close" size={16} color="#000" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.addButton} onPress={saveNote}>
              <AntDesign name={editingId ? "check" : "plus"} size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes List */}
        {notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notes yet. Add your first note above!</Text>
          </View>
        ) : (
          <FlatList
            data={notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.noteItem,
                  editingId === item.id && styles.editingNoteItem
                ]} 
                onPress={() => startEditing(item)}
              >
                <Text style={styles.noteText}>{item.text}</Text>
                <TouchableOpacity 
                  onPress={() => deleteNote(item.id)}
                  style={styles.deleteButtonContainer}
                >
                  <AntDesign name="close" size={18} color="#000" style={styles.deleteButton} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    paddingHorizontal: "5%",
    backgroundColor: "#000",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "IndieFlower_400Regular",
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignSelf: "flex-start",
  },
  header: {
    color: "#fff",
    fontSize: 24,
    textAlign: "center",
    marginVertical: 10,
    fontFamily: "IndieFlower_400Regular",
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 18,
    fontFamily: "IndieFlower_400Regular",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    padding: 8,
    marginRight: 5,
    marginVertical: 5,
  },
  addButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: Platform.OS === "ios" ? 10 : 8,
    margin: 5,
  },
  noteItem: {
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  editingNoteItem: {
    borderColor: "#fff",
    backgroundColor: "#1a1a1a",
  },
  noteText: {
    color: "#fff",
    fontSize: 18,
    flex: 1,
    fontFamily: "IndieFlower_400Regular",
  },
  deleteButtonContainer: {
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    fontFamily: "IndieFlower_400Regular",
    textAlign: "center",
  },
});