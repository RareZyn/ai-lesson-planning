import React, { useState } from 'react';
import './CreateLesson.css';

const CreateLesson = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('ai');
  const [aiFormData, setAiFormData] = useState({
    class: '',
    objective: '',
    topic: '',
    materials: ''
  });
  const [manualFormData, setManualFormData] = useState({
    class: '',
    topics: []
  });
  const [newTopic, setNewTopic] = useState('');

  // if (!isOpen) return null;

  const handleAiInputChange = (e) => {
    const { name, value } = e.target;
    setAiFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualInputChange = (e) => {
    const { name, value } = e.target;
    setManualFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      setManualFormData(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (index) => {
    setManualFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'ai') {
      console.log('AI Form Submitted:', aiFormData);
      // Handle AI form submission
    } else {
      console.log('Manual Form Submitted:', manualFormData);
      // Handle manual form submission
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Create New Lesson Planner</h2>
        
        <div className="tab-container">
          <button 
            className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            Create with AI
          </button>
          <button 
            className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Create Manually
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'ai' ? (
            <div className="ai-form">
              <div className="form-group">
                <label>Class</label>
                <input
                  type="text"
                  name="class"
                  value={aiFormData.class}
                  onChange={handleAiInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Objective</label>
                <textarea
                  name="objective"
                  value={aiFormData.objective}
                  onChange={handleAiInputChange}
                  required
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Topic</label>
                <input
                  type="text"
                  name="topic"
                  value={aiFormData.topic}
                  onChange={handleAiInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Materials</label>
                <textarea
                  name="materials"
                  value={aiFormData.materials}
                  onChange={handleAiInputChange}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="manual-form">
              <div className="form-group">
                <label>Class</label>
                <input
                  type="text"
                  name="class"
                  value={manualFormData.class}
                  onChange={handleManualInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Topics</label>
                <div className="topics-input-container">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Add a topic"
                  />
                  <button type="button" onClick={addTopic} className="add-button">
                    Add
                  </button>
                </div>
                
                {manualFormData.topics.length > 0 && (
                  <ul className="topics-list">
                    {manualFormData.topics.map((topic, index) => (
                      <li key={index}>
                        {topic}
                        <button 
                          type="button" 
                          onClick={() => removeTopic(index)}
                          className="remove-button"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {activeTab === 'ai' ? 'Generate with AI' : 'Create Planner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLesson;