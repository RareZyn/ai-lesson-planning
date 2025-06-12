import React, { useState, useEffect } from "react";
import { 
  Upload as UploadIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon
} from "@mui/icons-material";
import "./MaterialManagement.css";

const MaterialManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [uploadType, setUploadType] = useState("file");
  const [selectedFile, setSelectedFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockMaterials = [
      { 
        id: 1, 
        name: "English Grammar Guide", 
        type: "pdf", 
        date: "2025-05-15", 
        size: "2.4 MB",
        url: "https://example.com/sample.pdf" // Mock URL for PDF
      },
      { 
        id: 2, 
        name: "Vocabulary List", 
        type: "docx", 
        date: "2025-05-10", 
        size: "1.2 MB",
        url: "https://example.com/sample.docx" // Mock URL for DOCX
      },
      { 
        id: 3, 
        name: "Reading Comprehension Tips", 
        type: "link", 
        date: "2025-05-05", 
        size: "N/A",
        url: "https://example.com/reading-tips" // External link
      },
    ];
    setMaterials(mockMaterials);
    setFilteredMaterials(mockMaterials);
  }, []);

  // Filter materials based on search and filter
  useEffect(() => {
    let results = materials;
    
    if (searchTerm) {
      results = results.filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== "all") {
      results = results.filter(material => material.type === filterType);
    }
    
    setFilteredMaterials(results);
  }, [searchTerm, filterType, materials]);

  const handleMaterialClick = (material) => {
    setCurrentMaterial(material);
    if (material.type === "link") {
      // Open link in new tab
      window.open(material.url, '_blank');
    } else {
      // Open PDF/DOC in modal viewer
      setIsViewerModalOpen(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("File too large. Max size: 50 MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(file.type)) {
        alert("Invalid file type. Please upload PDF or Word documents.");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleLinkSubmit = () => {
    // Basic URL validation
    try {
      new URL(linkUrl);
    } catch (e) {
      alert("Please enter a valid URL");
      return;
    }
    
    // Here you would normally make an API call to save the link
    setIsLoading(true);
    setTimeout(() => {
      const newMaterial = {
        id: materials.length + 1,
        name: linkUrl,
        type: "link",
        date: new Date().toISOString().split('T')[0],
        size: "N/A"
      };
      setMaterials([...materials, newMaterial]);
      setLinkUrl("");
      setIsUploadModalOpen(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleFileSubmit = () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }
    
    // Here you would normally upload the file to your backend
    setIsLoading(true);
    setTimeout(() => {
      const newMaterial = {
        id: materials.length + 1,
        name: selectedFile.name,
        type: selectedFile.type.includes("pdf") ? "pdf" : "docx",
        date: new Date().toISOString().split('T')[0],
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      };
      setMaterials([...materials, newMaterial]);
      setSelectedFile(null);
      setIsUploadModalOpen(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleDeleteMaterial = (id) => {
    if (window.confirm("Confirm to delete, this act is irreversible")) {
      setMaterials(materials.filter(material => material.id !== id));
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return <DescriptionIcon className="file-icon pdf" />;
      case "docx":
        return <DescriptionIcon className="file-icon docx" />;
      case "link":
        return <LinkIcon className="file-icon link" />;
      default:
        return <DescriptionIcon className="file-icon" />;
    }
  };

  const renderViewerModal = () => {
    if (!currentMaterial) return null;

    return (
      <div className="modal-overlay">
        <div className="viewer-modal">
          <div className="modal-header">
            <h3>{currentMaterial.name}</h3>
            <button 
              className="close-button"
              onClick={() => setIsViewerModalOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="viewer-content">
            {currentMaterial.type === "pdf" ? (
              <iframe 
                src={currentMaterial.url}
                title={currentMaterial.name}
                width="100%" 
                height="100%"
                style={{ border: 'none' }}
              />
            ) : (
              <div className="doc-viewer-placeholder">
                <DescriptionIcon style={{ fontSize: 60, color: '#2c3e50' }} />
                <p>Document Viewer Placeholder</p>
                <a 
                  href={currentMaterial.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="open-external"
                >
                  <OpenInNewIcon /> Open in new tab
                </a>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <a 
              href={currentMaterial.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="open-external"
            >
              <OpenInNewIcon /> Open in new tab
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Update the materials list row to make it clickable
  const renderMaterialRow = (material) => (
    <tr 
      key={material.id} 
      className={material.type === "link" ? "link-row" : "file-row"}
      onClick={() => handleMaterialClick(material)}
    >
      <td>
        <div className="material-name">
          {getFileIcon(material.type)}
          <span>{material.name}</span>
          {material.type === "link" && <OpenInNewIcon className="external-icon" />}
        </div>
      </td>
      <td>{material.type.toUpperCase()}</td>
      <td>{material.date}</td>
      <td>{material.size}</td>
      <td>
        <button 
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteMaterial(material.id);
          }}
          title="Delete material"
        >
          <DeleteIcon />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="material-management-container">
      <div className="material-header">
        <h2>Material Management</h2>
        <button 
          className="upload-button"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <UploadIcon /> Upload Material
        </button>
      </div>

      <div className="material-controls">
        <div className="search-bar">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdown">
          <FilterIcon />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">Word</option>
            <option value="link">Links</option>
          </select>
        </div>
      </div>

       {/* Materials List Table */}
      <div className="materials-list">
        {filteredMaterials.length === 0 ? (
          <div className="empty-state">
            <p>No materials found. Upload your first material to get started!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Date Added</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(renderMaterialRow)}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h3>Upload Material</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadType("file");
                  setSelectedFile(null);
                  setLinkUrl("");
                }}
              >
                &times;
              </button>
            </div>

            <div className="upload-options">
              <button
                className={`option-button ${uploadType === "file" ? "active" : ""}`}
                onClick={() => setUploadType("file")}
              >
                Upload File
              </button>
              <button
                className={`option-button ${uploadType === "link" ? "active" : ""}`}
                onClick={() => setUploadType("link")}
              >
                Paste Link
              </button>
            </div>

            <div className="upload-content">
              {uploadType === "file" ? (
                <>
                  <div className="file-dropzone">
                    <UploadIcon className="upload-icon" />
                    <p>Drag & drop files here or</p>
                    <label className="file-input-label">
                      Browse Files
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                        style={{ display: "none" }}
                      />
                    </label>
                    {selectedFile && (
                      <div className="selected-file">
                        <DescriptionIcon />
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  <p className="file-requirements">
                    Supported formats: PDF, DOC, DOCX (Max 50MB)
                  </p>
                </>
              ) : (
                <>
                  <div className="link-input">
                    <LinkIcon />
                    <input
                      type="url"
                      placeholder="Paste your link here..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <p className="link-requirements">
                    Paste a valid URL to any educational resource
                  </p>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadType("file");
                  setSelectedFile(null);
                  setLinkUrl("");
                }}
              >
                Cancel
              </button>
              <button
                className="submit-button"
                onClick={uploadType === "file" ? handleFileSubmit : handleLinkSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {isViewerModalOpen && renderViewerModal()}
    </div>
  );
};

export default MaterialManagement;