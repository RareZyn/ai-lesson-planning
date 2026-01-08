import React, { useState, useEffect, useCallback } from 'react';
import { Pagination } from 'antd';
import { getAllClasses } from '../../services/classService';
import CreateClassModal from './CreateClassModal';
import ClassCard from './ClassCard'; // The reusable card for displaying a class
import { Search as SearchIcon, Groups as GroupsIcon } from '@mui/icons-material';
import { FaPlus } from 'react-icons/fa';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PlaceholderCard from '../../components/common/PlaceholderCard';
import './ClassManagement.css';

const CreateClassCard = ({ onClick }) => (
  <div className="add-class-card" onClick={onClick}>
    <div className="add-icon-wrapper">
      <FaPlus />
    </div>
    <h3 className="add-card-title">Create New Class</h3>
    <p className="add-card-text">Click to add class</p>
  </div>
);

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Adjust as needed

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setCurrentPage(1); // Reset to first page on filter change
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
          <div style={{ padding: "40px" }}>
            <LoadingSpinner tip="Loading classes..." />
          </div>
        ) : (
          <div className="class-cards-container">
            {/* --- Pagination --- */}
            {filteredClasses.length > itemsPerPage && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '10px 0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  marginBottom: '20px'
                }}
              >
                <Pagination
                  current={currentPage}
                  total={filteredClasses.length}
                  pageSize={itemsPerPage}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            )}

            {/* --- Render the Create Class Card first --- */}
            <CreateClassCard onClick={() => setIsModalOpen(true)} />

            {/* --- Render the fetched class cards --- */}
            {filteredClasses.length > 0 ? (
              filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((cls) => (
                <ClassCard key={cls._id} classInfo={cls} />
              ))
            ) : !searchTerm ? (
              <PlaceholderCard type="class" />
            ) : null}

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