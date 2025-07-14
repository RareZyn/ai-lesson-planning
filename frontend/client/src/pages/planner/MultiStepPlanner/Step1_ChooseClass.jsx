import React, { useState, useEffect } from "react";
import styles from "./MultiStepPlanner.module.css";
import { getAllClasses } from "../../../services/classService";
import CreateClassModal from "../../class/CreateClassModal";

const Step1_ChooseClass = ({ data, updateData, onNext }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect to fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedClasses = await getAllClasses();
        // Sort classes by grade for better organization
        const sortedClasses = fetchedClasses.sort((a, b) => {
          // Extract form number for sorting (e.g., "Form 1" -> 1)
          const formA = parseInt(a.grade.replace(/\D/g, "")) || 0;
          const formB = parseInt(b.grade.replace(/\D/g, "")) || 0;
          return formA - formB;
        });
        setClasses(sortedClasses);
      } catch (err) {
        setError("Failed to load classes.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleNextClick = () => {
    if (data.classId && data.grade) {
      onNext();
    } else {
      alert("Please select a class to continue.");
    }
  };

  // This function will be called by the modal upon successful creation
  const handleClassCreated = (newClass) => {
    // Add the new class to the list and re-sort
    const updatedClasses = [...classes, newClass].sort((a, b) => {
      const formA = parseInt(a.grade.replace(/\D/g, "")) || 0;
      const formB = parseInt(b.grade.replace(/\D/g, "")) || 0;
      return formA - formB;
    });
    setClasses(updatedClasses);
    // Automatically select the new class
    updateData("classId", newClass._id);
    updateData("grade", newClass.grade);
    setIsCreating(false);
  };

  // Group classes by grade for better organization
  const classesByGrade = classes.reduce((acc, cls) => {
    if (!acc[cls.grade]) {
      acc[cls.grade] = [];
    }
    acc[cls.grade].push(cls);
    return acc;
  }, {});

  return (
    <div className={styles.stepContent}>
      <h2>Step 1: Choose Your Class</h2>
      <p>Select an existing class or create a new one for this lesson plan.</p>

      <div className={styles.formGroup}>
        <label htmlFor="classId">Select an Existing Class</label>
        <select
          id="classId"
          name="classId"
          className={styles.selectInput}
          value={data.classId}
          onChange={(e) => {
            const selectedClass = classes.find(
              (cls) => cls._id === e.target.value
            );
            if (selectedClass) {
              updateData("classId", selectedClass._id);
              updateData("grade", selectedClass.grade);
            }
          }}
          disabled={isCreating || isLoading || error}
        >
          <option value="">
            {isLoading
              ? "Loading classes..."
              : error
              ? error
              : "-- Please select a class --"}
          </option>

          {!isLoading &&
            !error &&
            Object.entries(classesByGrade).map(([grade, gradeClasses]) => (
              <optgroup key={grade} label={grade}>
                {gradeClasses.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.className} - {cls.subject}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>

        {/* Show selected class info */}
        {data.classId && data.grade && (
          <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
            Selected grade: {data.grade}
          </small>
        )}
      </div>

      <div className={styles.orDivider}>
        <span>OR</span>
      </div>

      <div className={styles.formGroup}>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className={styles.secondaryButtonFullWidth}
        >
          Create a New Class
        </button>
      </div>

      {/* The modal is now controlled here */}
      {isCreating && (
        <CreateClassModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onSave={handleClassCreated}
        />
      )}

      <div className={styles.navigation}>
        <button onClick={handleNextClick} className={styles.primaryButton}>
          Next Step
        </button>
      </div>
    </div>
  );
};

export default Step1_ChooseClass;
