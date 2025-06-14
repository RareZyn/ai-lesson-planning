import React, { useState, useEffect } from 'react';
import styles from './MultiStepPlanner.module.css';
import { getSow } from '../../../services/sowService';

const Step2_LessonDetails = ({ data, updateData, onNext, onPrev }) => {
  const [sowLessons, setSowLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!data.grade) {
      setSowLessons([]);
      return;
    }

    const fetchSowLessons = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching SOW for grade: "${data.grade}"`);
        const response = await getSow(data.grade);
        console.log("SOW Response:", response);

        const lessons = response?.lessons || [];
        if (lessons.length > 0) {
          setSowLessons(lessons);
          // Auto-fill topic from SOW if a lesson is already selected and topic is empty
          if (data.sow?.topic && !data.specificTopic) {
            updateData('specificTopic', data.sow.topic);
          }
        } else {
          setError(
            `No lessons found for ${data.grade}. Please check if SOW data exists.`
          );
          setSowLessons([]);
        }
      } catch (err) {
        console.error("Failed to fetch SOW:", err);

        // More detailed error handling
        if (err.response?.status === 404) {
          setError(
            `No scheme of work found for ${data.grade}. Please contact your administrator to add SOW data.`
          );
        } else if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(`Failed to load lessons: ${err.message}`);
        }
        setSowLessons([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSowLessons();
  }, [data.grade]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // --- UPDATED VALIDATION ---
    if (!data.sow?.lessonNo || !data.specificTopic || !data.activityType || !data.proficiencyLevel || !data.hotsFocus) {
      alert("Please fill in all required fields.");
      return;
    }
    onNext();
  };

  return (
    <div className={styles.stepContent}>
      <h2>Step 2: Lesson Details</h2>
      <p>Fill in the core details based on the KSSM Scheme of Work.</p>

      <form onSubmit={handleSubmit}>
        {/* --- FIELD 1: Lesson from SOW --- */}
        <div className={styles.formGroup}>
          <label htmlFor="lessonNumber">Lesson from Scheme of Work</label>
          <select
            id="lessonNumber"
            name="lessonNumber"
            value={data.sow?.lessonNo || ''}
            onChange={(e) => {
              const selectedValue = e.target.value;
              const selectedLesson = sowLessons.find(
                (lesson) => lesson.lessonNo.toString() === selectedValue
              );
              updateData('sow', selectedLesson || {});
              // Also update the topic field with the SOW topic when a lesson is selected
              if (selectedLesson) {
                updateData('specificTopic', selectedLesson.topic);
              }
            }}
            disabled={isLoading}
            required
          >
            <option value="" disabled>-- Select Lesson --</option>
            {isLoading && <option disabled>Loading lessons...</option>}
            {error && <option disabled>Error: {error}</option>}
            {!isLoading && !error && sowLessons.length === 0 && <option disabled>No lessons available for {data.grade}</option>}
            {!isLoading && !error && sowLessons.map(lesson => (
              <option key={lesson.lessonNo} value={lesson.lessonNo}>
                Lesson {lesson.lessonNo} - {lesson.topic} ({lesson.focus})
              </option>
            ))}
          </select>

          {/* Show additional info about current grade and loading state */}
          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            {data.grade
              ? `Looking for lessons in ${data.grade}`
              : "Please select a class first"}
            {isLoading && " - Loading..."}
          </small>
        </div>
        
        {/* --- FIELD 2 (NEW ORDER): Specific Topic / Lesson Title --- */}
        <div className={styles.formGroup}>
          <label htmlFor="specificTopic">Lesson Title (Specific Topic or Context)</label>
          <input
            type="text"
            id="specificTopic"
            name="specificTopic"
            value={data.specificTopic || ''}
            onChange={(e) => updateData('specificTopic', e.target.value)}
            placeholder="e.g., 'The life of Nicol David'"
            required
          />
        </div>

        {/* --- FIELD 3 (NEW): Activity Format --- */}
        <div className={styles.formGroup}>
          <label htmlFor="activityType">Primary Activity Format</label>
          <select 
            id="activityType" 
            name="activityType" 
            value={data.activityType || ''} 
            onChange={(e) => updateData('activityType', e.target.value)} 
            required
          >
            <option value="" disabled>-- Select a format --</option>
            <option value="textbook">Textbook-based Activity</option>
            <option value="essay">Essay Writing</option>
            <option value="activityInClass">In-class Activity (e.g., group work, presentation)</option>
            <option value="assessment">Assessment / Test</option>
          </select>
        </div>

        {/* --- FIELD 4: Proficiency Level --- */}
        <div className={styles.formGroup}>
          <label htmlFor="proficiencyLevel">Class Proficiency Level</label>
          <select
            id="proficiencyLevel"
            name="proficiencyLevel"
            value={data.proficiencyLevel || ""}
            onChange={(e) => updateData("proficiencyLevel", e.target.value)}
            required
          >
            <option value="" disabled>
              -- Select Proficiency Level --
            </option>
            <option value="A1 Low">A1 Low</option>
            <option value="A1 Mid">A1 Mid</option>
            <option value="A1 High">A1 High</option>
            <option value="A2 Low">A2 Low</option>
            <option value="A2 Mid">A2 Mid</option>
            <option value="A2 High">A2 High</option>
            <option value="B1 Low">B1 Low</option>
            <option value="B1 Mid">B1 Mid</option>
            <option value="B1 High">B1 High</option>
          </select>
        </div>

        {/* --- FIELD 5: HOTS Focus --- */}
        <div className={styles.formGroup}>
          <label htmlFor="hotsFocus">HOTS Focus</label>
          <select
            id="hotsFocus"
            name="hotsFocus"
            value={data.hotsFocus || ""}
            onChange={(e) => updateData("hotsFocus", e.target.value)}
            required
          >
            <option value="" disabled>
              -- Select HOTS Focus --
            </option>
            <option value="apply">Applying</option>
            <option value="analyse">Analysing</option>
            <option value="evaluate">Evaluating</option>
            <option value="create">Creating</option>
          </select>
        </div>

        <div className={styles.navigation}>
          <button
            type="button"
            onClick={onPrev}
            className={styles.secondaryButton}
          >
            Previous
          </button>
          <button type="submit" className={styles.primaryButton}>
            Next Step
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step2_LessonDetails;
