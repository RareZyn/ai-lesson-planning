import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./MultiStepPlanner.module.css";
import { Modal } from "antd";

import ProgressBar from "./ProgressBar";
import Step1ChooseClass from "./Step1_ChooseClass";
import Step2LessonDetails from "./Step2_LessonDetails";
import Step3AdditionalInfo from "./Step3_AdditionalInfo";
import Step4ConfirmPlan from "./Step4_ConfirmPlan";

// --- IMPORT THE NEW SERVICE FUNCTION ---
import {
  generateLesson,
  saveLessonPlan,
  enhanceLessonSection, // <-- IMPORT THIS
} from "../../../services/lessonService";

const MultiStepPlanner = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // For major actions like generate/save
  const [isEnhancing, setIsEnhancing] = useState(false); // <-- NEW: For section enhancement
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    classId: "",
    sow: {},
    proficiencyLevel: "",
    activityType: "",
    activityConfiguration: null,
    hotsFocus: "",
    additionalNotes: "",
    grade: "",
  });

  const [generatedPlan, setGeneratedPlan] = useState(null);

  const getInitialDate = () => {
    const dateFromState = location.state?.selectedDate;
    return dateFromState ? new Date(dateFromState) : new Date();
  };

  const [plannerDate] = useState(getInitialDate()); // setPlannerDate removed - not currently used

  useEffect(() => {
    console.log("Form data updated:", formData);
  }, [formData]);

  const handleDataChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (section, value) => {
    setGeneratedPlan((prev) => ({ ...prev, [section]: value }));
  };

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handlePrev = () => setCurrentStep((prev) => prev - 1);

  const handleGenerate = async () => {
    // ... (no changes in this function)
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
    // ... (no changes in this function)
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
        Modal.success({
          title: 'Success',
          content: 'Lesson Plan Saved Successfully with Activity Configuration!',
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

  // --- NEW FUNCTION TO HANDLE AI ENHANCEMENT ---
  const handleEnhanceSection = async (sectionKey, userPrompt) => {
    setIsEnhancing(true);
    try {
      // Get the current content of the section to enhance.
      // The reduce function safely handles nested keys like 'activities.preLesson'.
      const currentContent = sectionKey
        .split(".")
        .reduce((obj, key) => obj[key], generatedPlan);

      const payload = {
        sectionKey,
        currentContent,
        userPrompt,
        context: {
          grade: formData.grade,
          subject: formData.sow?.subject || "Unknown",
          topic: formData.sow?.topic || "General",
        },
      };

      const enhancedContent = await enhanceLessonSection(payload);

      // Create a deep copy of the plan to avoid direct state mutation.
      const updatedPlan = JSON.parse(JSON.stringify(generatedPlan));

      // This logic safely updates the nested property in the copied object.
      const keys = sectionKey.split(".");
      let temp = updatedPlan;
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]];
      }
      temp[keys[keys.length - 1]] = enhancedContent;

      setGeneratedPlan(updatedPlan);
    } catch (error) {
      console.error("Failed to enhance section:", error);
      alert(`Enhancement Failed: ${error.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className={styles.plannerContainer}>
      <header className={styles.plannerHeader}>
        <h1>Generate a Lesson Plan</h1>
        <span>
          Date:{" "}
          {plannerDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        <ProgressBar currentStep={currentStep} totalSteps={4} />
      </header>

      <main className={styles.stepContainer}>
        {/* ... (no changes for steps 1, 2, 3) ... */}
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
            // --- PASS NEW PROPS FOR ENHANCEMENT ---
            onEnhanceSection={handleEnhanceSection}
            isEnhancing={isEnhancing}
          />
        )}
      </main>
    </div>
  );
};

export default MultiStepPlanner;