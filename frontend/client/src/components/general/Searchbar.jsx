import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import './Searchbar.css'; // This now assumes global CSS injection

// Debounce utility function
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

/**
 * Global Searchbar Component
 * This component handles user input, debouncing, and displays results in an overlay.
 * 
 * @param {function} globalSearchApi - Function that accepts a term and returns a promise resolving to results.
 * @param {function} onResultClick - Handler when a result item is clicked (e.g., navigation).
 */
const Searchbar = ({ 
    globalSearchApi, 
    onResultClick, 
    placeholder = "Search lessons, materials, and classes...",
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState(null); 
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    
    const searchRef = useRef(null); 

    // 1. Debounced API Call
    const debouncedSearch = useMemo(() => {
        return debounce(async (term) => {
            if (term.trim().length < 2) {
                setResults(null);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const data = await globalSearchApi(term); 
                setResults(data);
                setShowResults(true);
            } catch (error) {
                console.error("Global search failed:", error);
                setResults({ error: 'Failed to fetch results' });
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, [globalSearchApi]);

    // 2. Trigger Search on Term Change
    useEffect(() => {
        debouncedSearch(searchTerm);
    }, [searchTerm, debouncedSearch]);

    // 3. Close Results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleResultClick = (result) => {
        onResultClick(result);
        setSearchTerm(''); 
        setShowResults(false);
    };

    // Helper to render the results structure
    const renderResults = () => {
        if (!showResults) return null;

        if (isSearching) {
            return <div className="result-item">Searching...</div>;
        }

        if (results && results.error) {
            return <div className="result-item-error">{results.error}</div>;
        }
        
        const hasResults = results && (
            (results.lessons && results.lessons.length > 0) ||
            (results.materials && results.materials.length > 0) ||
            (results.classes && results.classes.length > 0)
        );

        if (!hasResults && searchTerm.length >= 2) {
             return <div className="result-item-no-results">No results found for "{searchTerm}"</div>;
        }
        
        return (
            <div className="results-dropdown">
                {/* Example of Lesson Results */}
                {results?.lessons?.length > 0 && (
                    <div className="result-section">
                        <h4 className="section-title">Lessons</h4>
                        {results.lessons.slice(0, 3).map(item => (
                            <div 
                                key={item._id} 
                                className="result-item"
                                onClick={() => handleResultClick({ type: 'lesson', id: item._id, title: item.title })}
                            >
                                <span className="item-type">Lesson</span> {item.title}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Example of Material Results */}
                {results?.materials?.length > 0 && (
                    <div className="result-section">
                        <h4 className="section-title">Materials</h4>
                         {results.materials.slice(0, 3).map(item => (
                            <div 
                                key={item._id} 
                                className="result-item"
                                onClick={() => handleResultClick({ type: 'material', id: item._id, title: item.title })}
                            >
                                <span className="item-type">Material</span> {item.title}
                            </div>
                        ))}
                    </div>
                )}
                
            </div>
        );
    };

    return (
        <div className="search-container" ref={searchRef}>
            <form className="modern-search-bar" onSubmit={(e) => e.preventDefault()}>
                <div className="search-icon">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { if (searchTerm) setShowResults(true); }}
                    className="search-input"
                />
            </form>
            {renderResults()}
        </div>
    );
};

export default Searchbar;