import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import {
    BookOutlined,
    TeamOutlined,
    FileTextOutlined,
    FormOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import './Searchbar.css';

// Searchable pages directory
const SEARCHABLE_PAGES = [
    { title: 'Home', path: '/app', keywords: ['dashboard', 'home', 'main'], type: 'page' },
    { title: 'My Lessons', path: '/app/lessons', keywords: ['lessons', 'lesson plans', 'teaching', 'plans'], type: 'page' },
    { title: 'Create Lesson Plan', path: '/app/planner', keywords: ['create', 'new lesson', 'planner', 'generate'], type: 'page' },
    { title: 'Classes', path: '/app/classes', keywords: ['class', 'classes', 'manage classes', 'students'], type: 'page' },
    { title: 'Assessments', path: '/app/assessment', keywords: ['assessment', 'test', 'exam', 'quiz', 'activities'], type: 'page' },
    { title: 'Materials', path: '/app/materials', keywords: ['materials', 'resources', 'teaching materials'], type: 'page' },
    { title: 'Submissions', path: '/app/submissions', keywords: ['submissions', 'student answers', 'grading'], type: 'page' },
    { title: 'Upload Submission', path: '/app/submissions/upload', keywords: ['upload', 'submit', 'answer sheet', 'ocr'], type: 'page' },
    { title: 'Analytics', path: '/app/analytics', keywords: ['analytics', 'reports', 'statistics', 'performance', 'progress'], type: 'page' },
    { title: 'Community', path: '/app/community', keywords: ['community', 'share', 'download', 'shared lessons'], type: 'page' },
    { title: 'Downloads', path: '/app/downloads', keywords: ['downloads', 'files', 'export'], type: 'page' },
];

const Searchbar = ({ placeholder = "Search pages & content...", onSearch }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Get icon based on entity type
    const getEntityIcon = (type) => {
        switch (type) {
            case 'lesson':
                return <BookOutlined className="suggestion-icon" />;
            case 'class':
                return <TeamOutlined className="suggestion-icon" />;
            case 'material':
                return <FileTextOutlined className="suggestion-icon" />;
            case 'assessment':
                return <FormOutlined className="suggestion-icon" />;
            case 'page':
                return <HomeOutlined className="suggestion-icon" />;
            default:
                return <SearchIcon className="suggestion-icon" fontSize="small" />;
        }
    };

    // Fetch search results from API
    const fetchSearchResults = async (query) => {
        if (!query.trim()) {
            setIsLoading(false);
            return [];
        }

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : [];
            }
        } catch (error) {
            console.error("Search API error:", error);
        }
        return [];
    };

    // Filter and combine page suggestions with API results
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (searchTerm.trim()) {
            setIsLoading(true);
            const lowerSearch = searchTerm.toLowerCase();

            // Filter page suggestions
            const pageResults = SEARCHABLE_PAGES.filter(page =>
                page.title.toLowerCase().includes(lowerSearch) ||
                page.keywords.some(keyword => keyword.toLowerCase().includes(lowerSearch))
            ).slice(0, 3); // Limit to 3 page results

            // Debounce API call
            debounceTimerRef.current = setTimeout(async () => {
                const apiResults = await fetchSearchResults(searchTerm);
                const combined = [...pageResults, ...apiResults].slice(0, 8); // Total limit 8
                setSuggestions(combined);
                setShowSuggestions(combined.length > 0);
                setSelectedIndex(-1);
                setIsLoading(false);
            }, 300); // 300ms debounce
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedIndex(-1);
            setIsLoading(false);
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchTerm]);

    // Handle window resize to update isMobile state
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            const itemToNavigate = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
            navigateToItem(itemToNavigate);
        } else if (searchTerm.trim() && onSearch) {
            onSearch(searchTerm);
        }
    };

    const navigateToItem = (item) => {
        navigate(item.path);
        setSearchTerm("");
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        if (isMobile) {
            setIsSearchExpanded(false);
        }
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
                    onFocus={() => searchTerm && suggestions.length > 0 && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                    autoComplete="off"
                />
                {/* Only show clear button on desktop, not on mobile when expanded */}
                {searchTerm && !isMobile && (
                    <button
                        type="button"
                        className="clear-search-btn"
                        onClick={clearSearch}
                        aria-label="Clear search"
                    >
                        <CloseIcon fontSize="small" />
                    </button>
                )}
                {isLoading && (
                    <div className="search-loading-indicator">
                        <LoadingSpinner size="small" tip="" />
                    </div>
                )}
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                    {suggestions.map((item, index) => (
                        <div
                            key={`${item.type}-${item.id || item.path}-${index}`}
                            className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => navigateToItem(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {getEntityIcon(item.type)}
                            <div className="suggestion-content">
                                <div className="suggestion-title">{item.title}</div>
                                <div className="suggestion-path">{item.subtitle || item.path}</div>
                            </div>
                            <span className={`suggestion-badge ${item.type}`}>
                                {item.type}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Searchbar;
