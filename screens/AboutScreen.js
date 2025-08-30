import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Linking,
  Alert,
  Modal,
  TextInput
} from "react-native";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import { useFonts, IndieFlower_400Regular } from "@expo-google-fonts/indie-flower";

export default function AboutScreen({ navigation }) {
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [helpSubject, setHelpSubject] = useState("");
  const [helpMessage, setHelpMessage] = useState("");
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  let [fontsLoaded] = useFonts({
    IndieFlower_400Regular
  });

  if (!fontsLoaded) {
    return null;
  }

  const sendEmail = (subject, body) => {
    const email = 'sethagyeimensah2@gmail.com';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            'Email Not Available',
            `Please send your message to: ${email}`,
            [
              { text: 'Copy Email', onPress: () => Clipboard.setString(email) },
              { text: 'OK' }
            ]
          );
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to open email client');
      });
  };

  const sendHelpEmail = () => {
    if (!helpSubject.trim() || !helpMessage.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message fields');
      return;
    }

    const emailBody = `Help Request from Task Manager App

Subject: ${helpSubject}

Message:
${helpMessage}

---
App Version: 1.0.0
Platform: ${Platform.OS}
Date: ${new Date().toLocaleString()}`;

    sendEmail(`Task Manager Help: ${helpSubject}`, emailBody);
    setHelpModalVisible(false);
    setHelpSubject("");
    setHelpMessage("");
  };

  const sendFeedback = () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('Error', 'Please write your feedback message');
      return;
    }

    const emailBody = `Feedback for Task Manager App

${feedbackMessage}

---
App Version: 1.0.0
Platform: ${Platform.OS}
Date: ${new Date().toLocaleString()}`;

    sendEmail('Task Manager App Feedback', emailBody);
    setFeedbackModalVisible(false);
    setFeedbackMessage("");
  };

  const features = [
    {
      icon: <AntDesign name="checkcircleo" size={24} color="#4CAF50" />,
      title: "Smart Task Management",
      description: "Create, organize, and complete tasks with ease. Set specific dates and reminder times for each task."
    },
    {
      icon: <AntDesign name="calendar" size={24} color="#2196F3" />,
      title: "Calendar Integration",
      description: "View your tasks in a beautiful calendar layout. See what's coming up and plan your week ahead."
    },
    {
      icon: <AntDesign name="notification" size={24} color="#FF9800" />,
      title: "Smart Reminders",
      description: "Never miss a deadline with customizable push notifications that remind you exactly when you need them."
    },
    {
      icon: <AntDesign name="filetext1" size={24} color="#9C27B0" />,
      title: "Quick Notes",
      description: "Capture ideas, thoughts, and important information in your personal notes section."
    },
    {
      icon: <AntDesign name="setting" size={24} color="#607D8B" />,
      title: "Personalization",
      description: "Customize your experience with flexible settings for notifications, appearance, and behavior."
    }
  ];

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
          <Text style={styles.headerTitle}>About</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* App Logo/Title Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <AntDesign name="checkcircle" size={60} color="#fff" />
            </View>
            <Text style={styles.appTitle}>Task Manager</Text>
            <Text style={styles.appSubtitle}>Stay Organized, Stay Focused</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>

          {/* App Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Your Personal Productivity Companion</Text>
            <Text style={styles.descriptionText}>
              Task Manager is designed to help you take control of your daily life through intelligent organization and timely reminders. 
              Whether you're managing work projects, personal goals, or daily errands, our app provides a seamless experience that adapts to your workflow.
            </Text>
            <Text style={styles.descriptionText}>
              With smart scheduling, persistent reminders, and intuitive organization, you'll never miss an important task again. 
              Complete your tasks in an organized manner and watch your productivity soar.
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  {feature.icon}
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Organization Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Stay Organized</Text>
            <View style={styles.benefitItem}>
              <AntDesign name="clockcircleo" size={20} color="#fff" />
              <Text style={styles.benefitText}>Schedule tasks for specific days and times</Text>
            </View>
            <View style={styles.benefitItem}>
              <AntDesign name="dashboard" size={20} color="#fff" />
              <Text style={styles.benefitText}>Track your progress with completion statistics</Text>
            </View>
            <View style={styles.benefitItem}>
              <AntDesign name="sync" size={20} color="#fff" />
              <Text style={styles.benefitText}>Automatic sync across all your devices</Text>
            </View>
            <View style={styles.benefitItem}>
              <AntDesign name="bulb1" size={20} color="#fff" />
              <Text style={styles.benefitText}>Capture ideas instantly with quick notes</Text>
            </View>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.sectionTitle}>Need Help?</Text>
            
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => setHelpModalVisible(true)}
            >
              <View style={styles.helpButtonContent}>
                <MaterialIcons name="help-outline" size={24} color="#4CAF50" />
                <View style={styles.helpButtonText}>
                  <Text style={styles.helpButtonTitle}>Get Support</Text>
                  <Text style={styles.helpButtonDescription}>
                    Having trouble? Send us a message and we'll help you out!
                  </Text>
                </View>
              </View>
              <AntDesign name="right" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => setFeedbackModalVisible(true)}
            >
              <View style={styles.helpButtonContent}>
                <AntDesign name="message1" size={24} color="#2196F3" />
                <View style={styles.helpButtonText}>
                  <Text style={styles.helpButtonTitle}>Send Feedback</Text>
                  <Text style={styles.helpButtonDescription}>
                    Share your thoughts and suggestions to help us improve
                  </Text>
                </View>
              </View>
              <AntDesign name="right" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => Alert.alert(
                'Quick Tips',
                '• Tap the calendar icon to set task dates\n• Use the clock icon to set reminder times\n• Swipe left on tasks for quick actions\n• Access all features from the sidebar menu\n• Check completed tasks in the "All Done" section'
              )}
            >
              <View style={styles.helpButtonContent}>
                <AntDesign name="infocirlceo" size={24} color="#FF9800" />
                <View style={styles.helpButtonText}>
                  <Text style={styles.helpButtonTitle}>Quick Tips</Text>
                  <Text style={styles.helpButtonDescription}>
                    Learn helpful shortcuts and features
                  </Text>
                </View>
              </View>
              <AntDesign name="right" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Contact Info */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Developer Contact</Text>
            <TouchableOpacity 
              onPress={() => sendEmail('Task Manager App Inquiry', 'Hello,\n\nI have a question about the Task Manager app:\n\n')}
              style={styles.emailButton}
            >
              <AntDesign name="mail" size={16} color="#666" />
              <Text style={styles.emailText}>sethagyeimensah2@gmail.com</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Made by Seth for productivity enthusiasts</Text>
            <Text style={styles.copyrightText}>© 2025 Task Manager. All rights reserved.</Text>
          </View>
        </ScrollView>

        {/* Help Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={helpModalVisible}
          onRequestClose={() => setHelpModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.helpModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Get Help & Support</Text>
                <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                  <AntDesign name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.helpModalBody}>
                <Text style={styles.helpLabel}>Subject</Text>
                <TextInput
                  style={styles.helpInput}
                  placeholder="What do you need help with?"
                  placeholderTextColor="#666"
                  value={helpSubject}
                  onChangeText={setHelpSubject}
                />
                
                <Text style={styles.helpLabel}>Message</Text>
                <TextInput
                  style={[styles.helpInput, styles.helpTextArea]}
                  placeholder="Describe your issue or question in detail..."
                  placeholderTextColor="#666"
                  value={helpMessage}
                  onChangeText={setHelpMessage}
                  multiline
                  numberOfLines={6}
                />
                
                <View style={styles.helpModalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setHelpModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={sendHelpEmail}
                  >
                    <AntDesign name="mail" size={16} color="#000" />
                    <Text style={styles.sendButtonText}>Send Email</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={feedbackModalVisible}
          onRequestClose={() => setFeedbackModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.helpModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Feedback</Text>
                <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                  <AntDesign name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.helpModalBody}>
                <Text style={styles.helpDescription}>
                  We'd love to hear your thoughts! Share your feedback, suggestions, or feature requests.
                </Text>
                
                <Text style={styles.helpLabel}>Your Feedback</Text>
                <TextInput
                  style={[styles.helpInput, styles.helpTextArea]}
                  placeholder="What do you think about the app? Any suggestions for improvement?"
                  placeholderTextColor="#666"
                  value={feedbackMessage}
                  onChangeText={setFeedbackMessage}
                  multiline
                  numberOfLines={8}
                />
                
                <View style={styles.helpModalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setFeedbackModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={sendFeedback}
                  >
                    <AntDesign name="heart" size={16} color="#000" />
                    <Text style={styles.sendButtonText}>Send Feedback</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#111',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#222',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: 'IndieFlower_400Regular',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#888',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#111',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  featureIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#222',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderRadius: 10,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 16,
    flex: 1,
  },
  helpSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  helpButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpButtonText: {
    marginLeft: 16,
    flex: 1,
  },
  helpButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  helpButtonDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 18,
  },
  contactSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#111',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emailText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IndieFlower_400Regular',
  },
  copyrightText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  helpModalContent: {
    backgroundColor: '#111',
    borderRadius: 16,
    maxHeight: '80%',
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
  helpModalBody: {
    padding: 20,
  },
  helpDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  helpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  helpInput: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  helpTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helpModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});