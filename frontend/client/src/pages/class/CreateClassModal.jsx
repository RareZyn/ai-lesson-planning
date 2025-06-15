// src/components/ClassModal.jsx
import React, { useState, useEffect } from 'react';
import { createClass, updateClass } from '../../services/classService';
import './CreateClassModal.css'; // Assuming you have a CSS module for styles

const CreateClassModal = ({ isOpen, onClose, onSave, currentClass }) => {
  const [formData, setFormData] = useState({
    className: '',
    grade: 'Standard 1',
    subject: 'English',
    year: new Date().getFullYear().toString()
  });
  const [isLoading, setIsLoading] = useState(false);

  // This effect syncs the form data when the modal is opened for editing
  useEffect(() => {
    if (isOpen) {
      if (currentClass) {
        setFormData({
          className: currentClass.className,
          grade: currentClass.grade,
          subject: currentClass.subject,
          year: currentClass.year.toString(),
        });
      } else {
        // Reset to default for creating a new class
        setFormData({
          className: '',
          grade: 'Standard 1',
          subject: 'English',
          year: new Date().getFullYear().toString(),
        });
      }
    }
  }, [currentClass, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (currentClass) {
        await updateClass(currentClass._id, formData);
        alert('Class updated successfully');
      } else {
        await createClass(formData);
        alert('Class created successfully');
      }
      onSave(); // Notify parent component that save was successful
    } catch (error) {
      console.error('Error saving class:', error);
      alert(error.response?.data?.error || 'Failed to save class');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null; // Don't render anything if the modal is closed
  }

  return (
    <div className="modal-overlay">
      <div className="class-modal">
        <div className="modal-header">
          <h3>{currentClass ? 'Edit Class' : 'Add New Class'}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="className">Class Name</label>
            <input type="text" id="className" name="className" value={formData.className} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="grade">Grade</label>
            <select id="grade" name="grade" value={formData.grade} onChange={handleInputChange} required>
              <option value="Standard 1">Standard 1</option>
              <option value="Standard 2">Standard 2</option>
              <option value="Standard 3">Standard 3</option>
              <option value="Standard 4">Standard 4</option>
              <option value="Standard 5">Standard 5</option>
              <option value="Standard 6">Standard 6</option>
              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>
              <option value="Form 5">Form 5</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <select id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required>
              <option value="English">English</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
              <option value="Geography">Geography</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="year">Academic Year</label>
            <select id="year" name="year" value={formData.year} onChange={handleInputChange} required>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? (currentClass ? 'Updating...' : 'Creating...') : (currentClass ? 'Update Class' : 'Create Class')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassModal;