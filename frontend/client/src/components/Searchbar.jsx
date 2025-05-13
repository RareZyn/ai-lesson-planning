import React, { useState } from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import './Searchbar.css';

const Searchbar = ({ placeholder = "Type to search materials, lessons etc...", onSearch }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            onSearch(searchTerm);
        }
    };

    return (
        <form className="modern-search-bar" onSubmit={handleSearch}>
            <div className="search-icon">
                <SearchIcon />
            </div>
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            />
        </form>
    );
};

export default Searchbar;