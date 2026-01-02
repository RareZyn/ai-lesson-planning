import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./MultiStepPlanner.module.css";
import { Modal, message, Button, Grid } from "antd"; // Removed Drawer, Layout
import { ThunderboltFilled, CalendarOutlined } from '@ant-design/icons';

import ProgressBar from "./ProgressBar";
import Step1ChooseClass from "./Step1_ChooseClass";
import Step2LessonDetails from "./Step2_LessonDetails";
import Step3AdditionalInfo from "./Step3_AdditionalInfo";
import Step4ConfirmPlan from "./Step4_ConfirmPlan";

// --- IMPORT THE NEW SERVICE FUNCTION ---
import {
  generateLesson,
  saveLessonPlan,
  enhanceLessonSection,
} from "../../../services/lessonService";

// --- NEW IMPORTS FOR SMART SUGGESTIONS ---
import SmartSuggestionPanel from "../../../components/planner/SmartSuggestionPanel"; // Check path
import {
  getSmartSuggestions,
  recordFeedback
} from "../../../services/smartSuggestionsService";

const MultiStepPlanner = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const navigate = useNavigate();

  // --- SMART SUGGESTIONS STATE ---
  const [suggestions, setSuggestions] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState([]); // Track accepted types ["date", "sowTopic"]
  const [showSuggestions, setShowSuggestions] = useState(false); // [NEW] Control visibility

  const [formData, setFormData] = useState({
    classId: "",
    sow: {},
    proficiencyLevel: "",
    activityType: "",
    activityConfiguration: null,
    hotsFocus: "",
    additionalNotes: "",
    grade: "",
    subject: "",
    materialId: null,
  });

  const [generatedPlan, setGeneratedPlan] = useState(null);

  const getInitialDate = () => {
    const dateFromState = location.state?.selectedDate;
    return dateFromState ? new Date(dateFromState) : new Date();
  };

  const [plannerDate, setPlannerDate] = useState(getInitialDate());

  // Log form data updates
  useEffect(() => {
    console.log("Form data updated:", formData);
  }, [formData]);


  // --- SMART SUGGESTIONS LOGIC ---

  // 1. Fetch suggestions - Manual Trigger Only
  const handleFetchSuggestions = () => {
    setShowSuggestions(true);
    if (!suggestions || (suggestions && formData.classId !== suggestions.classId)) {
      fetchSuggestions();
    }
  };

  const handleDismissSuggestions = () => {
    setShowSuggestions(false);
  };

  useEffect(() => {
    // Reset suggestions if class changes, but don't auto-fetch
    if (formData.classId && suggestions && formData.classId !== suggestions.classId) {
      setSuggestions(null);
      setPatterns(null);
      setShowSuggestions(false); // Reset visibility on class change
    }
  }, [formData.classId, suggestions]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    console.log("[Component] Starting fetch suggestions...");
    try {
      const result = await getSmartSuggestions(formData.classId);
      console.log("[Component] Result received:", result);

      if (result) {
        console.log("[Component] Setting suggestions to state");
        setSuggestions({ ...result.suggestions, classId: formData.classId }); // track classId
        setPatterns(result.patterns);
      } else {
        console.log("[Component] No success or no data");
        // Handle no data or error gracefully
        setSuggestions(null);
        setPatterns(null);
      }
    } catch (error) {
      console.error("Failed to load suggestions", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 2. Apply Handlers
  const handleApplyTopic = (sowTopic) => {
    // sowTopic matches structure expected by form logic? 
    // Adapting to match what Step2 expects for 'sow'
    // Usually 'sow' is the full object from the SOW dropdown
    // Start simple: Update formData.sow if possible, or just notify user to select it
    // If sowTopic contains ID, we can find it. If just strings, might be tricky.

    // Assumption: The suggestion provides enough data to map to formData
    // For now, let's assume we update the specificTopic or additionalNotes if SOW is complex
    // Or if suggestion returns a matching SOW object

    // If backend returns a clear title, we might set that as specificTopic if no SOW object
    // But typically SOW is selected from a list.
    // Let's retry: Update specificTopic for now? OR alert the user.
    // Ideally, the SOW suggestions should return an ID if it matches our DB.

    // Let's assume for now we set specificTopic text as a seamless fallback
    // and if we have the sow object, we set it.

    // UPDATE: Backend suggestion structure: { title, rationale }

    // We will set specificTopic and maybe a note
    setFormData(prev => ({
      ...prev,
      specificTopic: sowTopic.title || prev.specificTopic,
    }));

    // Also track as applied
    markApplied('sowTopic');
    message.success(`Applied topic: ${sowTopic.title}`);
  };

  const handleApplyDate = (dateSuggestion) => {
    // dateSuggestion: { date: "YYYY-MM-DD", rationale: ... }
    const newDate = new Date(dateSuggestion.date);
    setPlannerDate(newDate); // Update parent state date
    markApplied('date');
    message.success(`Applied date: ${newDate.toDateString()}`);
  };

  const handleApplyActivity = (activityTypeSuggestion) => {
    // activityTypeSuggestion: { type: "reading", rationale: ... }
    setFormData(prev => ({
      ...prev,
      activityType: activityTypeSuggestion.type
    }));
    markApplied('activityType');
    message.success(`Applied activity: ${activityTypeSuggestion.type}`);
  };

  const handleApplyResource = (resource) => {
    // resource: { _id, name, type, ... }
    // Add to materialId (if single select) or list
    // Current formData uses `materialId` (single). 
    // If we want multiple, we need to check Step2 implementation.
    // Assuming single for now based on formData.

    setFormData(prev => ({
      ...prev,
      materialId: resource._id
    }));
    markApplied('resource'); // Generic 'resource' tag or specific?
    message.success(`Selected resource: ${resource.name}`);
  };

  const markApplied = (type) => {
    if (!appliedSuggestions.includes(type)) {
      setAppliedSuggestions(prev => [...prev, type]);
    }
  }


  const handleDataChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (section, value) => {
    setGeneratedPlan((prev) => ({ ...prev, [section]: value }));
  };

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handlePrev = () => setCurrentStep((prev) => prev - 1);

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedPlan(null);
    try {
      const planObject = await generateLesson(formData);
      setGeneratedPlan(planObject);
      handleNext();
    } catch (error) {
      Modal.error({
        title: 'Generation Failed',
        content: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    const finalLessonPlan = {
      parameters: {
        ...formData,
        activityConfiguration: formData.activityConfiguration,
        activityType: formData.activityType,
      },
      plan: generatedPlan,
      date: plannerDate.toISOString(),
      activityType: formData.activityType,
      activityConfiguration: formData.activityConfiguration,
    };

    try {
      const response = await saveLessonPlan(finalLessonPlan);
      if (response.success) {
        const newPlanId = response.data._id;

        // --- 3. RECORD FEEDBACK FOR APPLIED SUGGESTIONS ---
        if (appliedSuggestions.length > 0) {
          // Did they use the suggestions?
          // Loop through accepted types and record
          // We do this silently in background
          const feedbackPromises = appliedSuggestions.map(type =>
            recordFeedback(newPlanId, type, true, true)
          );
          Promise.all(feedbackPromises).then(() => console.log("Feedback recorded"));
        }

        Modal.success({
          title: 'Success',
          content: 'Lesson Plan Saved Successfully!',
          onOk: () => navigate(`/app/lessons/${newPlanId}`),
        });
      }
    } catch (error) {
      console.error("Failed to save lesson plan:", error);
      Modal.error({
        title: 'Error',
        content: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXISTING ENHANCEMENT LOGIC ---
  const handleEnhanceSection = async (sectionKey, userPrompt) => {
    setIsEnhancing(true);
    try {
      const currentContent = sectionKey
        .split(".")
        .reduce((obj, key) => obj[key], generatedPlan);

      const payload = {
        sectionKey,
        currentContent,
        userPrompt,
        context: {
          grade: formData.grade,
          subject: formData.subject || formData.sow?.subject || "Unknown",
          topic: (() => {
            const sow = formData.sow;
            if (!sow) return "General";
            return sow.Title || sow.Topic || sow.topic || sow.title || Object.values(sow)[0] || "General";
          })(),
        },
      };

      const enhancedContent = await enhanceLessonSection(payload);
      const updatedPlan = JSON.parse(JSON.stringify(generatedPlan));
      const keys = sectionKey.split(".");
      let temp = updatedPlan;
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]];
      }
      temp[keys[keys.length - 1]] = enhancedContent;

      setGeneratedPlan(updatedPlan);
    } catch (error) {
      console.error("Failed to enhance section:", error);
      message.error(`Enhancement Failed: ${error.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const { useBreakpoint } = Grid;

  // Hook for breakpoints
  const screens = useBreakpoint();
  // Assume mobile if screens.md is false (or use xs/sm specifically)
  // Actually, standard AntD breakpoints: xs < 576, sm >= 576, md >= 768.
  // We want Drawer for anything smaller than 'lg' (992) or maybe 'md' (768).
  // Let's go with 'md' (Tablets/Phones get Drawer).
  const isMobile = !screens.lg; // simplified check

  // Helper function to render the suggestion content (CTA or Panel)
  const renderSuggestionContent = () => {
    if (!showSuggestions) {
      return (
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #fffbe6 0%, #fff 100%)',
          border: '1px dashed #ffe58f',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(250, 173, 20, 0.1)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
          <h4 style={{ margin: '0 0 8px 0', color: '#874d00' }}>Need ideas?</h4>
          <p style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '16px' }}>
            Let our AI analyze your teaching patterns and suggest a plan.
          </p>
          <Button
            type="primary"
            shape="round"
            icon={<ThunderboltFilled />}
            onClick={handleFetchSuggestions}
            style={{
              background: '#faad14',
              borderColor: '#faad14',
              boxShadow: '0 2px 0 rgba(135, 77, 0, 0.1)'
            }}
          >
            Get AI Suggestions
          </Button>
        </div>
      );
    } else {
      return (
        <SmartSuggestionPanel
          loading={loadingSuggestions}
          suggestions={suggestions}
          patterns={patterns}
          onApplyTopic={handleApplyTopic}
          onApplyDate={handleApplyDate}
          onApplyActivity={handleApplyActivity}
          onApplyResource={handleApplyResource}
          onRefresh={fetchSuggestions}
          onDismiss={handleDismissSuggestions}
          appliedSuggestions={appliedSuggestions}
        />
      );
    }
  };

  return (
    <div className={styles.plannerContainer}>
      {/* ... Header ... */}
      <header className={styles.plannerHeader}>
        <h1>Generate a Lesson Plan</h1>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '1rem', color: '#6b7280', fontWeight: '500' }}>
          <CalendarOutlined style={{ fontSize: '18px' }} />
          {`${plannerDate.toLocaleDateString('en-US', { weekday: 'long' })}, ${String(plannerDate.getDate()).padStart(2, '0')}/${String(plannerDate.getMonth() + 1).padStart(2, '0')}/${plannerDate.getFullYear()}`}
        </span>
        <ProgressBar currentStep={currentStep} totalSteps={4} />
      </header>

      {/* Main Content Area */}
      {/* If mobile, we stack or use full width. If desktop, flex row. */}
      {/* We keep flex but if isMobile, the sidebar won't be in the flow. */}
      {/* Main Content Area */}
      <div className={styles.stepContainer} style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        position: 'relative',
        flexDirection: isMobile ? 'column' : 'row'
      }}>

        {/* Main Form Area */}
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : 'auto' }}>
          {currentStep === 1 && (
            <Step1ChooseClass
              data={formData}
              updateData={handleDataChange}
              onNext={handleNext}
            />
          )}

          {currentStep === 2 && (
            <Step2LessonDetails
              data={formData}
              updateData={handleDataChange}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 3 && (
            <Step3AdditionalInfo
              data={formData}
              updateData={handleDataChange}
              onGenerate={handleGenerate}
              onPrev={handlePrev}
              isLoading={isLoading}
            />
          )}

          {currentStep === 4 && (
            <Step4ConfirmPlan
              plan={generatedPlan}
              updatePlan={handlePlanChange}
              onSave={handleSave}
              onPrev={handlePrev}
              formData={formData}
              onEnhanceSection={handleEnhanceSection}
              isEnhancing={isEnhancing}
            />
          )}
        </div>

        {/* Sidebar Logic: Only Step 2 */}
        {currentStep === 2 && (
          <div style={{
            width: isMobile ? '100%' : '320px',
            flexShrink: 0,
            order: isMobile ? -1 : 0
          }}>
            {renderSuggestionContent()}
          </div>
        )}

      </div>
    </div>
  );
};


export default MultiStepPlanner;