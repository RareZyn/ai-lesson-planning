import React, { useState, useEffect } from 'react';
import styles from './MultiStepPlanner.module.css';
import axios from 'axios';
import CreateClassModal from '../../class/CreateClassModal';
const Step1_ChooseClass = ({ data, updateData, onNext }) => {
    const [isCreating, setIsCreating] = useState(false);

    // State for API data
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect to fetch data when the component mounts
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                // --- REPLACE THIS WITH YOUR REAL API CALL ---
                const response = await axios.get('/api/classes', getAuthConfig());
                const data = response.data?.data || [];
                setClasses(data);

                // Simulating API call
                // console.log("Fetching classes...");
                // await new Promise(resolve => setTimeout(resolve, 1000));
                // setClasses([{_id: 'c1', className: '5 Amanah'}, {_id: 'c2', className: '5 Bestari'}]);
                // --- END OF SIMULATION ---

            } catch (err) {
                setError('Failed to load classes. Please try again.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClasses();
    }, []); // Empty array means this runs once on mount

    const getAuthConfig = () => ({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    });

    const handleNextClick = () => {
        if ((data.classId || (isCreating && data.className)) && data.grade) {
            onNext();
        } else {
            alert('Please select or create a class to continue.');
        }
    };

    return (
        <div className={styles.stepContent}>
            <h2>Step 1: Choose Your Class</h2>
            <p>Select an existing class or create a new one for this lesson plan.</p>

            <div className={styles.formGroup}>
                <label htmlFor="classId">Select Existing Class</label>
                <select id="classId" value={data.classId} onChange={(e) => {
                    updateData('classId', e.target.value);
                    updateData('grade', e.target.options[e.target.selectedIndex].getAttribute('grade'));
                }} disabled={isCreating || isLoading || error}>
                    <option value="">
                        {isLoading ? "Loading classes..." : error ? error : "-- Please select --"}
                    </option>
                    {!isLoading && !error && classes.map(cls => <option key={cls._id} grade={cls.grade} value={cls._id}>{cls.className}</option>)}
                </select>
            </div>

            <div className={styles.orDivider}>OR</div>

            {isCreating ? (
                <CreateClassModal isOpen={isCreating} onClose={() => setIsCreating(false)} onSubmit={(newClass) => {
                    updateData('classId', newClass._id);
                    setIsCreating(false);
                }} />
            ) : (
                <button onClick={() => setIsCreating(true)} className={styles.secondaryButton}>Create a New Class</button>
            )}

            <div className={styles.navigation}>
                <button onClick={handleNextClick} className={styles.primaryButton}>Next Step</button>
            </div>
        </div>
    );
};

export default Step1_ChooseClass;