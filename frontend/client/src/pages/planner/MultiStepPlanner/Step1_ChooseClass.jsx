import React, { useState, useEffect } from 'react';
import styles from './MultiStepPlanner.module.css'; // This file will be updated with new styles
import { getAllClasses } from '../../../services/classService';
import CreateClassModal from '../../class/CreateClassModal';

const Step1_ChooseClass = ({ data, updateData, onNext }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect to fetch classes (logic is unchanged)
    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedClasses = await getAllClasses();
                setClasses(fetchedClasses);
            } catch (err) {
                setError('Failed to load classes.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []);

    const handleNextClick = () => {
        // Validation logic is unchanged
        if (data.classId && data.grade) {
            onNext();
        } else {
            alert('Please select a class to continue.');
        }
    };

    // This function will be called by the modal upon successful creation
    const handleClassCreated = (newClass) => {
        // Add the new class to the top of the list
        const updatedClasses = [newClass, ...classes];
        setClasses(updatedClasses);
        // Automatically select the new class
        updateData('classId', newClass._id);
        updateData('grade', newClass.grade);
        setIsCreating(false);
    };

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
                        const selectedClass = classes.find(cls => cls._id === e.target.value);
                        if (selectedClass) {
                            updateData('classId', selectedClass._id);
                            updateData('grade', selectedClass.grade);
                        }
                    }}
                    disabled={isCreating || isLoading || error}
                >
                    <option value="">
                        {isLoading ? "Loading classes..." : error ? error : "-- Please select a class --"}
                    </option>
                    {!isLoading && !error && classes.map(cls =>
                        <option key={cls._id} value={cls._id}>
                            {cls.className} ({cls.subject})
                        </option>
                    )}
                </select>
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
                <button onClick={handleNextClick} className={styles.primaryButton}>Next Step</button>
            </div>
        </div>
    );
};

export default Step1_ChooseClass;