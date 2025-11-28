import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './Searchbar.css';

// Searchable pages directory
const SEARCHABLE_PAGES = [
    { title: 'Home', path: '/app', keywords: ['dashboard', 'home', 'main'] },
    { title: 'My Lessons', path: '/app/lessons', keywords: ['lessons', 'lesson plans', 'teaching', 'plans'] },
    { title: 'Create Lesson Plan', path: '/app/planner', keywords: ['create', 'new lesson', 'planner', 'generate'] },
    { title: 'Classes', path: '/app/classes', keywords: ['class', 'classes', 'manage classes', 'students'] },
    { title: 'Assessments', path: '/app/assessment', keywords: ['assessment', 'test', 'exam', 'quiz', 'activities'] },
    { title: 'Materials', path: '/app/materials', keywords: ['materials', 'resources', 'teaching materials'] },
    { title: 'Submissions', path: '/app/submissions', keywords: ['submissions', 'student answers', 'grading'] },
    { title: 'Upload Submission', path: '/app/submissions/upload', keywords: ['upload', 'submit', 'answer sheet', 'ocr'] },
    { title: 'Analytics', path: '/app/analytics', keywords: ['analytics', 'reports', 'statistics', 'performance', 'progress'] },
    { title: 'Community', path: '/app/community', keywords: ['community', 'share', 'download', 'shared lessons'] },
    { title: 'Downloads', path: '/app/downloads', keywords: ['downloads', 'files', 'export'] },
];

const Searchbar = ({ placeholder = "Type to search pages...", onSearch }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Filter suggestions based on search term
    useEffect(() => {
        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            const filtered = SEARCHABLE_PAGES.filter(page =>
                page.title.toLowerCase().includes(lowerSearch) ||
                page.keywords.some(keyword => keyword.toLowerCase().includes(lowerSearch))
            ).slice(0, 6); // Limit to 6 suggestions

            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
            setSelectedIndex(-1);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    }, [searchTerm]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
                // Only collapse on mobile if search is empty
                if (window.innerWidth <= 768 && !searchTerm) {
                    setIsSearchExpanded(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (suggestions.length > 0) {
            const pageToNavigate = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
            navigateToPage(pageToNavigate);
        } else if (searchTerm.trim() && onSearch) {
            onSearch(searchTerm);
        }
    };

    const navigateToPage = (page) => {
        navigate(page.path);
        setSearchTerm("");
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    const toggleSearchExpand = () => {
        setIsSearchExpanded(!isSearchExpanded);
        // Focus input when expanding
        if (!isSearchExpanded) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            // Clear search when collapsing
            setSearchTerm("");
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    return (
        <div className="search-container" ref={searchRef}>
            {/* Toggle Button (visible only on mobile) */}
            <button
                type="button"
                className="search-toggle-btn"
                onClick={toggleSearchExpand}
                aria-label={isSearchExpanded ? "Close search" : "Open search"}
            >
                {isSearchExpanded ? <CloseIcon /> : <SearchIcon />}
            </button>

            <form className={`modern-search-bar ${isSearchExpanded ? 'expanded' : ''}`} onSubmit={handleSearch}>
                <div className="search-icon">
                    <SearchIcon />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchTerm && suggestions.length > 0 && setShowSuggestions(true)}
                    className="search-input"
                    autoComplete="off"
                />
                {searchTerm && (
                    <button
                        type="button"
                        className="clear-search-btn"
                        onClick={clearSearch}
                        aria-label="Clear search"
                    >
                        <CloseIcon fontSize="small" />
                    </button>
                )}
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                    {suggestions.map((page, index) => (
                        <div
                            key={page.path}
                            className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => navigateToPage(page)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <SearchIcon className="suggestion-icon" fontSize="small" />
                            <div className="suggestion-content">
                                <div className="suggestion-title">{page.title}</div>
                                <div className="suggestion-path">{page.path}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Searchbar;