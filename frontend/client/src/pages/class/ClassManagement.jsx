import React, { useState, useEffect, useCallback } from 'react';
import { getAllClasses, deleteClass } from '../../services/classService'; // Import from service

import CreateClassModal from './CreateClassModal'; // Import the new modal component

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Groups as GroupsIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import './ClassManagement.css';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);

  // State for UI controls
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [view, setView] = useState('table');

  // Fetch classes using the dedicated service
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllClasses();
      setClasses(data);
      setFilteredClasses(data); // Initialize filtered list
    } catch (error) {
      console.error('Error fetching classes:', error);
      alert(error.response?.data?.error || 'Failed to fetch classes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Apply filters whenever search term, year, or the main classes list changes
  useEffect(() => {
    let results = classes;
    if (searchTerm) {
      results = results.filter(cls =>
        cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterYear !== 'all') {
      results = results.filter(cls => cls.year.toString() === filterYear);
    }
    setFilteredClasses(results);
  }, [searchTerm, filterYear, classes]);


  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await deleteClass(id);
      alert('Class deleted successfully');
      fetchClasses(); // Re-fetch data after deletion
    } catch (error) {
      console.error('Error deleting class:', error);
      alert(error.response?.data?.error || 'Failed to delete class');
    }
  };

  // --- MODAL CONTROL FUNCTIONS ---

  // Opens the modal for editing an existing class or creating a new one
  const handleOpenModal = (cls = null) => {
    setCurrentClass(cls);
    setIsModalOpen(true);
  };

  // Closes the modal and resets the current class state
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentClass(null);
  };

  // Callback function for the modal to signal a successful save
  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchClasses(); // Refresh the class list
  };

  return (
    <div className="class-management-container">
      <div className="class-header">
        <h2>Class Management</h2>
        <button className="add-button" onClick={() => handleOpenModal()}>
          <AddIcon /> Add Class
        </button>
      </div>

      <div className="class-controls">
        <div className="search-bar">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-and-view">
          <div className="filter-dropdown">
            <FilterIcon />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">All Years</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div className="view-switcher">
            <button
              className={`view-button ${view === 'table' ? 'active' : ''}`}
              onClick={() => setView('table')}
              title="Table View"
            >
              <ViewListIcon />
            </button>
            <button
              className={`view-button ${view === 'card' ? 'active' : ''}`}
              onClick={() => setView('card')}
              title="Card View"
            >
              <ViewModuleIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="classes-list">
        {isLoading && filteredClasses.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading classes...</p>
          </div>
        ) : !Array.isArray(filteredClasses) || filteredClasses.length === 0 ? (
          <div className="empty-state">
            <GroupsIcon style={{ fontSize: 50, color: '#ccc' }}/>
            <p>No classes found that match your criteria.</p>
            {searchTerm === '' && filterYear === 'all' && (
                <button className="add-button-empty" onClick={() => handleOpenModal()}>
                    <AddIcon /> Create your first class
                </button>
            )}
          </div>
        ) : (
          <>
            {view === 'table' && (
              <table>
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Grade</th>
                    <th>Subject</th>
                    <th>Year</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((cls) => (
                    <tr key={cls._id}>
                      <td>
                        <div className="class-name">
                          <GroupsIcon className="class-icon" />
                          {cls.className}
                        </div>
                      </td>
                      <td>{cls.grade}</td>
                      <td>{cls.subject}</td>
                      <td>{cls.year}</td>
                      <td className="actions-column">
                        <div className="action-buttons">
                          <button className="edit-button" onClick={() => handleOpenModal(cls)} title="Edit class">
                            <EditIcon />
                          </button>
                          <button className="delete-button" onClick={() => handleDelete(cls._id)} title="Delete class">
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {view === 'card' && (
              <div className="class-cards-container">
                {filteredClasses.map((cls) => (
                  <div key={cls._id} className="class-card">
                    <div className="card-header">
                      <GroupsIcon className="class-icon" />
                      <div className="card-title">
                        <h4>{cls.className}</h4>
                        <span>{cls.subject}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <p>Year: <strong>{cls.year}</strong></p>
                      <p>Grade: <strong>{cls.grade}</strong></p>
                    </div>
                    <div className="card-actions">
                      <button className="card-edit-button" onClick={() => handleOpenModal(cls)}>
                        <EditIcon fontSize="small" /> Edit
                      </button>
                      <button className="card-delete-button" onClick={() => handleDelete(cls._id)}>
                        <DeleteIcon fontSize="small" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Render the modal component using props */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSuccess}
        currentClass={currentClass}
      />
    </div>
  );
};

export default ClassManagement;