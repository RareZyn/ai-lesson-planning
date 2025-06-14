import React, { useState, useEffect, useCallback } from 'react';
import { getAllClasses } from '../../services/classService';
import CreateClassModal from './CreateClassModal';
import ClassCard from './ClassCard'; // Import the new reusable card
import { Add as AddIcon, Search as SearchIcon, Groups as GroupsIcon } from '@mui/icons-material';
import './ClassManagement.css';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllClasses();
      setClasses(data);
      setFilteredClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    const results = classes.filter(cls =>
      cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClasses(results);
  }, [searchTerm, classes]);

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchClasses();
  };

  return (
    <div className="class-management-container">
      <div className="class-header">
        <h2>My Classes</h2>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          <AddIcon /> Add Class
        </button>
      </div>

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
          <div className="loading-state"><div className="spinner"></div></div>
        ) : filteredClasses.length === 0 ? (
          <div className="empty-state">
            <GroupsIcon style={{ fontSize: 50, color: '#ccc' }}/>
            <p>No classes found. Create your first class to get started!</p>
            <button className="add-button-empty" onClick={() => setIsModalOpen(true)}>
              <AddIcon /> Create a Class
            </button>
          </div>
        ) : (
          <div className="class-cards-container">
            {filteredClasses.map((cls) => (
              <ClassCard key={cls._id} classInfo={cls} />
            ))}
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