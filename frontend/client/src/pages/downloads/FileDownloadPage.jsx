// src/pages/downloads/FileDownloadPage.jsx
import React, { useState } from "react";
import { Eye, Download } from "lucide-react";
import LessonInfoModal from "../../components/Modal/AssessmentCreative/LessonInfoModal";
import "./FileDownloadPage.css";

const FileDownloadPage = () => {
  const [currentPage, setCurrentPage] = useState(7);
  const [sortBy, setSortBy] = useState("Date");
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Dummy data matching the design
  const dummyData = Array.from({ length: 85 }, (_, index) => ({
    id: index + 1,
    class: "5 Anggerik",
    lesson: 1,
    lessonInSoV: 19,
    day: "Monday",
    date: "1/4/2025",
    time: "8:00 - 10:00 am",
    activityMaterial: `activity_material_${index + 1}.pdf`,
    schemaAnswer: `schema_answer_${index + 1}.pdf`,
  }));

  const itemsPerPage = 10;
  const totalPages = Math.ceil(dummyData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = dummyData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDownload = (filename) => {
    // Simulate download
    console.log(`Downloading ${filename}`);
    // You can implement actual download logic here
  };

  const handleView = (item) => {
    setSelectedLesson(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLesson(null);
  };

  const renderPageNumbers = () => {
    const pages = [];

    // Always show page 1
    if (currentPage > 3) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="page-btn"
        >
          1
        </button>
      );
      if (currentPage > 4) {
        pages.push(
          <span key="dots1" className="page-dots">
            ...
          </span>
        );
      }
    }

    // Show pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`page-btn ${currentPage === i ? "active" : ""}`}
        >
          {i}
        </button>
      );
    }

    // Show last page if not already shown
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push(
          <span key="dots2" className="page-dots">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="page-btn"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="file-download-container">
      <div className="file-download-header">
        <h1 className="page-title">File Download</h1>
        <div className="header-controls">
          <div className="sort-container">
            <label htmlFor="sort-select">Sort By</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="Date">Date</option>
              <option value="Class">Class</option>
              <option value="Lesson">Lesson</option>
              <option value="Time">Time</option>
            </select>
          </div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Input Search Text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            <button className="search-btn">Search</button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Lesson</th>
              <th>Lesson in SoV</th>
              <th>Day</th>
              <th>Date</th>
              <th>Time</th>
              <th>Details</th>
              <th>Activity Material</th>
              <th>Schema Answer</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => (
              <tr key={item.id}>
                <td>{item.class}</td>
                <td>{item.lesson}</td>
                <td>{item.lessonInSoV}</td>
                <td>{item.day}</td>
                <td>{item.date}</td>
                <td>{item.time}</td>
                <td>
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleView(item)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                </td>
                <td>
                  <button
                    className="action-btn download-btn"
                    onClick={() => handleDownload(item.activityMaterial)}
                    title="Download Activity Material"
                  >
                    <Download size={16} />
                  </button>
                </td>
                <td>
                  <button
                    className="action-btn download-btn"
                    onClick={() => handleDownload(item.schemaAnswer)}
                    title="Download Schema Answer"
                  >
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <span className="pagination-info">Total {dummyData.length} items</span>
        <div className="pagination">
          {renderPageNumbers()}
          <button
            className="page-btn next-btn"
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>

      <LessonInfoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        lessonData={selectedLesson}
      />
    </div>
  );
};

export default FileDownloadPage;
