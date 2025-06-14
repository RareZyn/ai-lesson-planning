// src/pages/planner/MultiStepPlanner/Step2_LessonDetails.jsx

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
        const response = await getSow(data.grade);
        const lessons = response?.lessons || [];
        if (lessons.length > 0) {
          setSowLessons(lessons);
        } else {
          setError(`No lessons found for ${data.grade}.`);
          setSowLessons([]);
        }
      } catch (err) {
        console.error("Failed to fetch SOW:", err);
        setError('Failed to load lessons. Please try again.');
        setSowLessons([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSowLessons();
  }, [data.grade]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // --- FIX: Validate using the Sow object directly ---
    if (!data.sow?.lessonNo || !data.proficiencyLevel || !data.hotsFocus || !data.specificTopic) {
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
        <div className={styles.formGroup}>
          <label htmlFor="lessonNumber">Lesson from Scheme of Work</label>
          <select
            id="lessonNumber"
            name="lessonNumber"
            // --- FIX: The value is now derived from the Sow object ---
            value={data.sow?.lessonNo || ''}
            onChange={(e) => {
              const selectedValue = e.target.value;
              // Find the full lesson object from the fetched data
              const selectedLesson = sowLessons.find(
                lesson => lesson.lessonNo.toString() === selectedValue
              );
              // --- FIX: Update only the Sow object in the parent state ---
              updateData('sow', selectedLesson || {});
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
                Lesson {lesson.lessonNo} ({lesson.focus})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="proficiencyLevel">Class Proficiency Level</label>
          <select id="proficiencyLevel" name="proficiencyLevel" value={data.proficiencyLevel || ''} onChange={(e) => updateData('proficiencyLevel', e.target.value)} required>
            <option value="" disabled>-- Select Proficiency Level --</option>
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

        <div className={styles.formGroup}>
          <label htmlFor="hotsFocus">HOTS Focus</label>
          <select id="hotsFocus" name="hotsFocus" value={data.hotsFocus || ''} onChange={(e) => updateData('hotsFocus', e.target.value)} required>
            <option value="" disabled>-- Select HOTS Focus --</option>
            <option value="apply">Applying</option>
            <option value="analyse">Analysing</option>
            <option value="evaluate">Evaluating</option>
            <option value="creating">Creating</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="specificTopic">Specific Topic or Context</label>
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

        <div className={styles.navigation}>
          <button type="button" onClick={onPrev} className={styles.secondaryButton}>Previous</button>
          <button type="submit" className={styles.primaryButton}>Next Step</button>
        </div>
      </form>
    </div>
  );
};

export default Step2_LessonDetails;