// src/pages/planner/MultiStepPlanner/MultiStepPlanner.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./MultiStepPlanner.module.css";
import { Modal } from "antd";

import ProgressBar from "./ProgressBar";
import Step1ChooseClass from "./Step1_ChooseClass";
import Step2LessonDetails from "./Step2_LessonDetails";
import Step3AdditionalInfo from "./Step3_AdditionalInfo";
import Step4ConfirmPlan from "./Step4_ConfirmPlan";
import {
  generateLesson,
  saveLessonPlan,
} from "../../../services/lessonService";

const MultiStepPlanner = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Updated formData to include activity configuration
  const [formData, setFormData] = useState({
    classId: "",
    sow: {},
    proficiencyLevel: "",
    activityType: "",
    activityConfiguration: null, // NEW: Store activity configuration
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
    setIsLoading(true);
    setGeneratedPlan(null);

    try {
      // Ensure we pass the complete formData including activity configuration
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

    // Prepare the final lesson plan with activity configuration
    const finalLessonPlan = {
      parameters: {
        ...formData,
        // Ensure activity configuration is preserved
        activityConfiguration: formData.activityConfiguration,
        activityType: formData.activityType,
      },
      plan: generatedPlan,
      lessonDate: plannerDate.toISOString(),
      // Include activity info at top level for easy access
      activityType: formData.activityType,
      activityConfiguration: formData.activityConfiguration,
    };

    console.log("Final Lesson Plan with Activity Config:", finalLessonPlan);

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
            formData={formData} // Pass form data to show activity configuration
          />
        )}
      </main>
    </div>
  );
};

export default MultiStepPlanner;
