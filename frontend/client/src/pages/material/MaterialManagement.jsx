import React, { useState, useEffect } from "react";
import {
  Upload as UploadIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Modal, message, Progress } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import "./MaterialManagement.css";
import { getMaterials, uploadMaterial, deleteMaterial, updateMaterial, getMaterialById } from "../../services/materialService";


const MaterialManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState("file");
  const [selectedFile, setSelectedFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await getMaterials();
      if (response.success) {
        setMaterials(response.data);
        setFilteredMaterials(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      message.error("Failed to load materials");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
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

  const handleMaterialClick = async (material) => {
    // Determine type from material object
    const isLink = material.type === "link";

    if (isLink) {
      try {
        const response = await getMaterialById(material._id);
        if (response.success && response.data.originalFileUrl) {
          window.open(response.data.originalFileUrl, '_blank');
        } else {
          message.error("Could not open link");
        }
      } catch (error) {
        message.error("Failed to open link");
      }
      return;
    }

    // For Files (PDF/Doc)
    setIsLoading(true);
    try {
      const response = await getMaterialById(material._id);
      if (response.success && response.data.originalFileUrl) {
        const dataUri = response.data.originalFileUrl;

        // Check if it's a data URI
        if (!dataUri.startsWith('data:')) {
          message.error("Invalid file format");
          return;
        }

        // Convert Base64 to Blob
        const byteString = atob(dataUri.split(',')[1]);
        const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);

        // Open in new tab
        window.open(blobUrl, '_blank');
      } else {
        message.error("File content not found");
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to load material");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Modal.warning({
          title: 'File Too Large',
          content: 'File too large. Max size: 10 MB',
        });
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(file.type)) {
        Modal.warning({
          title: 'Invalid File Type',
          content: 'Please upload PDF or Word documents.',
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleLinkSubmit = async () => {
    // Basic URL validation
    try {
      new URL(linkUrl);
    } catch (e) {
      Modal.warning({
        title: 'Invalid URL',
        content: 'Please enter a valid URL',
      });
      return;
    }

    setIsLoading(true);
    try {
      await uploadMaterial({
        name: linkUrl,
        type: "link",
        fileData: linkUrl,
        size: "N/A"
      });
      message.success("Link added successfully");
      setLinkUrl("");
      setIsUploadModalOpen(false);
      fetchMaterials();
    } catch (error) {
      console.error("Upload error:", error);
      message.error(error.message || "Failed to add link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = () => {
    if (!selectedFile) {
      Modal.warning({
        title: 'No File Selected',
        content: 'Please select a file first',
      });
      return;
    }

    setIsLoading(true);

    // Convert to Base64
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      try {
        const base64Data = reader.result;

        // Reset progress
        setUploadProgress(0);

        await uploadMaterial({
          name: selectedFile.name,
          type: selectedFile.type.includes("pdf") ? "pdf" : "docx",
          fileData: base64Data,
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
        }, (percent) => {
          setUploadProgress(percent);
        });

        message.success("Material uploaded successfully");
        setSelectedFile(null);
        setIsUploadModalOpen(false);
        setUploadProgress(0);
        fetchMaterials();
      } catch (error) {
        console.error("Upload error:", error);
        message.error(error.message || "Failed to upload file");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      message.error("Failed to read file");
    };
  };

  const handleEditClick = (material, e) => {
    e.stopPropagation();
    setEditingMaterial(material);
    setEditName(material.name);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editName.trim()) {
      message.warning("Name cannot be empty");
      return;
    }

    try {
      await updateMaterial(editingMaterial._id, { name: editName });
      message.success("Material renamed successfully");
      setIsEditModalOpen(false);
      fetchMaterials();
    } catch (error) {
      console.error("Edit error", error);
      message.error("Failed to rename material");
    }
  };

  const handleDeleteMaterial = (id) => {
    Modal.confirm({
      title: 'Delete Material',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this material? This action is irreversible.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteMaterial(id);
          message.success("Material deleted");
          fetchMaterials();
        } catch (error) {
          message.error("Failed to delete material");
        }
      },
    });
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



  // Update the materials list row to make it clickable
  const renderMaterialRow = (material) => (
    <tr
      key={material.id}
      className={material.type === "link" ? "link-row" : "file-row"}
      onClick={() => handleMaterialClick(material)}
    >
      <td data-label="Name">
        <div className="material-name">
          {getFileIcon(material.type)}
          <span>{material.name}</span>
          {material.type === "link" && <OpenInNewIcon className="external-icon" />}
        </div>
      </td>
      <td data-label="Type">{material.type.toUpperCase()}</td>
      <td data-label="Date Added">{material.date}</td>
      <td data-label="Size">{material.size}</td>
      <td data-label="Actions">
        <div className="action-buttons">
          <button
            className="edit-button"
            onClick={(e) => handleEditClick(material, e)}
            title="Edit name"
            style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2' }}
          >
            <EditIcon />
          </button>
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMaterial(material._id); // Ensure using _id
            }}
            title="Delete material"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }}
          >
            <DeleteIcon />
          </button>
        </div>
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

      {/* Materials List Container */}
      <div className="materials-list-container">
        {filteredMaterials.length === 0 ? (
          <div className="empty-state">
            <p>No materials found. Upload your first material to get started!</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-view">
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
            </div>

            {/* Mobile Card Grid View */}
            <div className="mobile-view">
              <div className="mobile-grid">
                {filteredMaterials.map(material => (
                  <div
                    key={material._id}
                    className="material-card"
                    onClick={() => handleMaterialClick(material)}
                  >
                    <div className={`material-card-header ${material.type}`}>
                      <div className="card-preview-icon">
                        {getFileIcon(material.type)}
                      </div>
                      <div className="card-actions">
                        <button
                          className="edit-button-card"
                          onClick={(e) => handleEditClick(material, e)}
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <button
                          className="delete-button-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMaterial(material._id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </div>
                    <div className="material-card-content">
                      <h3 className="card-title" title={material.name}>{material.name}</h3>

                      <div className="card-meta-row">
                        <span className={`card-tag ${material.type}`}>{material.type.toUpperCase()}</span>
                        {material.size && <span className="card-size">{material.size}</span>}
                      </div>

                      <div className="card-footer-b">
                        <span className="card-date">{material.date}</span>
                        {material.type === 'link' && <OpenInNewIcon className="card-link-icon" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
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
                    Supported formats: PDF, DOC, DOCX (Max 10MB)
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
              {isLoading && uploadType === 'file' && (
                <div style={{ width: '100%', marginBottom: '10px' }}>
                  <Progress percent={uploadProgress} status="active" />
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>Uploading and Processing...</p>
                </div>
              )}
              <button
                className="cancel-button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadType("file");
                  setSelectedFile(null);
                  setLinkUrl("");
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="submit-button"
                onClick={uploadType === "file" ? handleFileSubmit : handleLinkSubmit}
                disabled={isLoading || (uploadType === "file" ? !selectedFile : !linkUrl)}
              >
                {isLoading ? "Processing..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        title="Rename Material"
        open={isEditModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setIsEditModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
      >
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Material Name</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
              fontSize: '14px'
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MaterialManagement;