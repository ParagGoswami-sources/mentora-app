/*import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";

export default function TestDetailScreen() {
  const route = useRoute();
  const { examName } = route.params as { examName: string };
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const fileMap: Record<string, string> = {
          Aptitude: "Aptitude.json",
          Personality: "Personality.json",
          Interest: "Interest.json",
          EQ: "EQ.json",
          "Orientation Style": "OrientationStyle.json",
          Reasoning: "reasoning_10th.json",
          "Basic Math": "basic_math_10th.json",
          Science: "science_10th.json",
          Physics: "science_11_12.json",
          Chemistry: "science_11_12.json",
          Math: "science_11_12.json",
          Biology: "science_11_12.json",
          Commerce: "commerce_10th.json",
          Arts: "arts_10th.json",
          "General Knowledge": "general_knowledge_10th.json",
          CSE: "bca_ug.json",
          BCA: "bca_ug.json",
          B.Tech: "btech_ug.json",
          BBA: "bba_ug.json",
          B.Com: "bcom_ug.json",
          BA: "ba_ug.json",
          B.Sc: "bsc_ug.json",
          BFA: "bfa_ug.json",
        };

        const filename = fileMap[examName];
        if (!filename) {
          setQuestions([]);
          return;
        }

        const questionsData = require(`../data/questions/${filename}`);
        setQuestions(questionsData.slice(0, 20));
      } catch (error) {
        console.error("Failed to load questions", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [examName]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{examName} Test</Text>
      <FlatList
        data={questions}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.questionCard}>
            <Text style={styles.question}>{index + 1}. {item.question}</Text>
            {item.options?.map((opt: string, i: number) => (
              <TouchableOpacity key={i} style={styles.option}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  questionCard: { backgroundColor: "#2c2c54", padding: 16, borderRadius: 10, marginBottom: 10 },
  question: { fontSize: 16, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  option: { backgroundColor: "#3d3d5c", padding: 10, borderRadius: 8, marginVertical: 4 },
  optionText: { color: "#fff" },
});
*/
