import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenTemplate from '../components/ScreenTemplate';
import { useStudent } from '../context/StudentContext';
import { useTestProgress } from '../context/TestProgressContext';
import { analyzeRoadmap, RoadmapAnalysis, FieldAlignment } from '../utils/roadmapAnalysis';

export default function RoadmapScreen() {
  const { studentData } = useStudent();
  const { completedTests, psychometricCompleted, psychometricTotal } = useTestProgress();
  const [analysis, setAnalysis] = useState<RoadmapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRoadmap();
  }, [completedTests]);

  const generateRoadmap = async () => {
    try {
      setLoading(true);
      const roadmapAnalysis = analyzeRoadmap(completedTests, studentData);
      setAnalysis(roadmapAnalysis);
    } catch (error) {
      console.error('Error generating roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressCard = () => (
    <View style={styles.progressCard}>
      <Text style={styles.progressTitle}>Assessment Progress</Text>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${analysis?.completionPercentage || 0}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {psychometricCompleted}/{psychometricTotal} Tests Completed
        </Text>
      </View>
      
      {!analysis?.isComplete && (
        <View style={styles.incompleteSection}>
          <Text style={styles.incompleteText}>
            Complete all {psychometricTotal} mandatory psychometric assessments to unlock your personalized roadmap
          </Text>
          <Text style={styles.remainingText}>
            {psychometricTotal - psychometricCompleted} tests remaining
          </Text>
        </View>
      )}
    </View>
  );

  const renderFieldCard = (field: FieldAlignment) => (
    <View key={field.field} style={[styles.fieldCard, { borderLeftColor: field.color }]}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldTitleContainer}>
          <Text style={styles.fieldTitle}>{field.field}</Text>
          <Text style={styles.fieldCategory}>{field.category}</Text>
        </View>
        <View style={[styles.alignmentBadge, { backgroundColor: field.color }]}>
          <Text style={styles.alignmentText}>{field.alignmentPercentage}%</Text>
        </View>
      </View>
      
      <Text style={styles.fieldDescription}>{field.description}</Text>
      
      {/* Alignment Percentage Bar */}
      <View style={styles.alignmentSection}>
        <Text style={styles.alignmentLabel}>Alignment with Your Profile</Text>
        <View style={styles.alignmentBarContainer}>
          <View style={styles.alignmentBar}>
            <View 
              style={[
                styles.alignmentBarFill,
                { 
                  width: `${field.alignmentPercentage}%`,
                  backgroundColor: field.color
                }
              ]}
            />
          </View>
          <Text style={styles.alignmentPercentageText}>{field.alignmentPercentage}%</Text>
        </View>
      </View>

      {/* Strengths */}
      {field.strengths.length > 0 && (
        <View style={styles.strengthsSection}>
          <Text style={styles.sectionTitle}>Why This Fits You:</Text>
          {field.strengths.map((strength, idx) => (
            <View key={idx} style={styles.strengthItem}>
              <Text style={styles.strengthBullet}>✅</Text>
              <Text style={styles.strengthText}>{strength}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Career Paths */}
      <View style={styles.careerSection}>
        <Text style={styles.sectionTitle}>Career Opportunities:</Text>
        <View style={styles.careerPaths}>
          {field.careerPaths.slice(0, 3).map((career, idx) => (
            <View key={idx} style={[styles.careerChip, { borderColor: field.color }]}>
              <Text style={[styles.careerChipText, { color: field.color }]}>{career}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Education Path */}
      <View style={styles.educationSection}>
        <Text style={styles.sectionTitle}>Education Path:</Text>
        <Text style={styles.educationText}>{field.educationPath[0]}</Text>
      </View>
    </View>
  );

  const renderPsychometricSummary = () => {
    if (!analysis?.psychometricSummary) return null;
    
    const { psychometricSummary } = analysis;
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Profile Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Aptitude</Text>
            <Text style={styles.summaryValue}>{psychometricSummary.aptitude}%</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Emotional Intelligence</Text>
            <Text style={styles.summaryValue}>{psychometricSummary.emotionalIntelligence}%</Text>
          </View>
        </View>
        
        <View style={styles.summaryDetails}>
          <Text style={styles.summaryDetailText}>
            <Text style={styles.summaryDetailLabel}>Personality: </Text>
            {psychometricSummary.personality}
          </Text>
          <Text style={styles.summaryDetailText}>
            <Text style={styles.summaryDetailLabel}>Learning Style: </Text>
            {psychometricSummary.learningStyle}
          </Text>
          <Text style={styles.summaryDetailText}>
            <Text style={styles.summaryDetailLabel}>Interests: </Text>
            {psychometricSummary.interests.join(', ')}
          </Text>
        </View>
      </View>
    );
  };

  const renderNextSteps = () => {
    if (!analysis?.nextSteps.length) return null;
    
    return (
      <View style={styles.nextStepsCard}>
        <Text style={styles.nextStepsTitle}>Your Next Steps</Text>
        {analysis.nextSteps.map((step, index) => (
          <View key={index} style={styles.nextStepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenTemplate title="Career Roadmap" scrollable={false}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating your personalized roadmap...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="Career Roadmap" scrollable={false}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Progress Card */}
          {renderProgressCard()}

          {analysis?.isComplete && (
            <>
              {/* Welcome Message */}
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>🎉 Your Personalized Career Roadmap</Text>
                <Text style={styles.welcomeText}>
                  Welcome, {studentData?.name}! Based on your comprehensive assessment, 
                  here are the career fields that align best with your unique profile.
                </Text>
              </View>

              {/* Overall Recommendation */}
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>Our Top Recommendation</Text>
                <Text style={styles.recommendationText}>{analysis.overallRecommendation}</Text>
              </View>

              {/* Psychometric Summary */}
              {renderPsychometricSummary()}

              {/* Top Field Recommendations */}
              <View style={styles.fieldsSection}>
                <Text style={styles.fieldsSectionTitle}>Career Field Recommendations</Text>
                <Text style={styles.fieldsSectionSubtitle}>
                  Ranked by alignment with your aptitude and interests
                </Text>
                {analysis.topRecommendations.map((field) => renderFieldCard(field))}
              </View>

              {/* Next Steps */}
              {renderNextSteps()}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },

  // Progress Card
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  progressTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
  },
  incompleteSection: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  incompleteText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  remainingText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  welcomeText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
  },

  // Recommendation Card
  recommendationCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  recommendationTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recommendationText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    flex: 0.48,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 5,
  },
  summaryValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDetails: {
    gap: 8,
  },
  summaryDetailText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 22,
  },
  summaryDetailLabel: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Fields Section
  fieldsSection: {
    marginBottom: 20,
  },
  fieldsSectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fieldsSectionSubtitle: {
    color: '#e0e0e0',
    fontSize: 16,
    marginBottom: 20,
    fontStyle: 'italic',
  },

  // Field Card
  fieldCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  fieldTitleContainer: {
    flex: 1,
  },
  fieldTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fieldCategory: {
    color: '#e0e0e0',
    fontSize: 14,
    fontStyle: 'italic',
  },
  alignmentBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  alignmentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fieldDescription: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },

  // Alignment Section
  alignmentSection: {
    marginBottom: 15,
  },
  alignmentLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  alignmentBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignmentBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  alignmentBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  alignmentPercentageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 35,
  },

  // Strengths Section
  strengthsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  strengthBullet: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  strengthText: {
    color: '#e0e0e0',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },

  // Career Section
  careerSection: {
    marginBottom: 15,
  },
  careerPaths: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  careerChip: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  careerChipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Education Section
  educationSection: {
    marginBottom: 10,
  },
  educationText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Next Steps Card
  nextStepsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  nextStepsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    color: '#e0e0e0',
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
});
