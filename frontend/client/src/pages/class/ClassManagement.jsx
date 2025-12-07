import React, { useState, useEffect, useCallback } from 'react';
import { getAllClasses } from '../../services/classService';
import CreateClassModal from './CreateClassModal';
import ClassCard from './ClassCard'; // The reusable card for displaying a class
import { Add as AddIcon, Search as SearchIcon, Groups as GroupsIcon } from '@mui/icons-material';
import { FaPlus } from 'react-icons/fa';
import './ClassManagement.css';

const CreateClassCard = ({ onClick }) => (
  <div className="add-class-card" onClick={onClick}>
    <div className="add-icon-wrapper">
      <FaPlus />
    </div>
    <h3 className="add-class-card-title">Create New Class</h3>
    <p className="add-class-card-text">Click to add class</p>
  </div>
);

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch classes from the backend
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllClasses();
      setClasses(data);
      setFilteredClasses(data); // Initialize filtered list with all classes
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Apply search filter whenever the search term or class list changes
  useEffect(() => {
    const results = classes.filter(cls =>
      cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClasses(results);
  }, [searchTerm, classes]);

  // Callback for the modal to refresh the list after a new class is saved
  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchClasses();
  };

  return (
    <div className="class-management-container">
      <div className="class-controls">
        <div className="search-bar">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search by class name or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="classes-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading classes...</p>
          </div>
        ) : (
          <div className="class-cards-container">
            {/* --- Render the Create Class Card first --- */}
            <CreateClassCard onClick={() => setIsModalOpen(true)} />

            {/* --- Render the fetched class cards --- */}
            {filteredClasses.map((cls) => (
              <ClassCard key={cls._id} classInfo={cls} />
            ))}

            {/* --- Special message if search finds no results --- */}
            {classes.length > 0 && filteredClasses.length === 0 && searchTerm && (
              <div className="empty-state">
                <GroupsIcon style={{ fontSize: 50, color: '#ccc' }} />
                <p>No classes found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
      />
    </div>
  );
};

export default ClassManagement;