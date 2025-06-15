// src/pages/planner/MultiStepPlanner/MultiStepPlanner.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './MultiStepPlanner.module.css';

import ProgressBar from './ProgressBar';
import Step1_ChooseClass from './Step1_ChooseClass';
import Step2_LessonDetails from './Step2_LessonDetails';
import Step3_AdditionalInfo from './Step3_AdditionalInfo';
import Step4_ConfirmPlan from './Step4_ConfirmPlan';
import {
  generateLesson,
  saveLessonPlan,
} from '../../../services/lessonService';

const MultiStepPlanner = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Initialize navigate hook

  // --- FIX: Removed redundant 'lessonNumber' field ---
  const [formData, setFormData] = useState({
    classId: '',
    sow: {},
    proficiencyLevel: '',
    activityType: '',
    hotsFocus: '',
    additionalNotes: '',
    grade: "",
  });

  const [generatedPlan, setGeneratedPlan] = useState(null);

  const getInitialDate = () => {
    const dateFromState = location.state?.selectedDate;
    return dateFromState ? new Date(dateFromState) : new Date();
  };

  const [plannerDate, setPlannerDate] = useState(getInitialDate());

  useEffect(() => {
    console.log(formData)
  }, [plannerDate]);

  const handleDataChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (section, value) => {
    setGeneratedPlan(prev => ({ ...prev, [section]: value }));
  };

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handlePrev = () => setCurrentStep(prev => prev - 1);

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedPlan(null); // Clear previous plans

    try {
      const planObject = await generateLesson(formData);
      setGeneratedPlan(planObject);
      handleNext(); // Only go to the next step on success
    } catch (error) {
      // Catch the error from the service and show it to the user
      alert(`Generation Failed: ${error.message}`);
    } finally {
      // This will run whether the try or catch block executes
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    const finalLessonPlan = {
      parameters: formData,
      plan: generatedPlan,
      date: plannerDate.toISOString(), // Include the date
    };
    console.log('Final Lesson Plan:', finalLessonPlan);
    try {
      // Call the service to save the plan
      const response = await saveLessonPlan(finalLessonPlan);

      if (response.success) {
        // Extract the new ID from the response data
        const newPlanId = response.data._id;
        alert('Lesson Plan Saved Successfully!');
        // Redirect to the new display page
        navigate(`/app/lessons/${newPlanId}`);
      }
    } catch (error) {
      console.error('Failed to save lesson plan:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className={styles.plannerContainer}>
      <header className={styles.plannerHeader}>
        <h1>Generate a Lesson Plan</h1>
        <span>Date: {plannerDate.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })}</span>
        <ProgressBar currentStep={currentStep} totalSteps={4} />
      </header>

      <main className={styles.stepContainer}>
        {currentStep === 1 && <Step1_ChooseClass data={formData} updateData={handleDataChange} onNext={handleNext} />}
        {currentStep === 2 && <Step2_LessonDetails data={formData} updateData={handleDataChange} onNext={handleNext} onPrev={handlePrev} />}
        {currentStep === 3 && <Step3_AdditionalInfo data={formData} updateData={handleDataChange} onGenerate={handleGenerate} onPrev={handlePrev} isLoading={isLoading} />}
        {currentStep === 4 && <Step4_ConfirmPlan plan={generatedPlan} updatePlan={handlePlanChange} onSave={handleSave} onPrev={handlePrev} />}
      </main>
    </div>
  );
};

export default MultiStepPlanner;