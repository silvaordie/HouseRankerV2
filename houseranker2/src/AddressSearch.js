import React, { useState, useEffect } from "react";
import { TextField, InputAdornment, List, ListItem, ListItemButton, ListItemText, Paper, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const AddressSearch = ({ label, value, disabled, onChange, disableInteraction }) => {
  const [query, setQuery] = useState(value || ""); // Initialize with the provided value
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const fetchSuggestions = async () => {
    if (!query) return;
    setIsSearching(true); // Show "Searching..." during the API call
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          limit: 5,
        },
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSuggestions(["Searching..."]); // Show "Searching..." immediately while typing
    setIsSearching(true);

    // Debounce the search call (trigger after 2 seconds of inactivity)
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchTimeout(
      setTimeout(() => {
        setIsSearching(false);
        fetchSuggestions();
      }, 2000)
    );

    if (onChange) {
      onChange(newQuery); // Notify parent of typing changes
    }
  };

  const handleSearchClick = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    fetchSuggestions();
  };

  const handleSuggestionClick = (suggestion) => {
    const selectedAddress = suggestion.display_name || suggestion; // Handle "Searching..." or actual results
    const geolocation = {
      lat: suggestion.lat,
      lon: suggestion.lon,
    };

    setQuery(selectedAddress);
    setSuggestions([]);

    // Send both the address and geolocation to the parent component
    if (onChange) {
      onChange(selectedAddress, geolocation); // Pass address and geolocation
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <TextField
        label={label}
        value={query}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && fetchSuggestions()}
        disabled={disabled || disableInteraction}
        fullWidth
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                onClick={handleSearchClick}
                edge="start"
                disabled={disabled || disableInteraction}
              >
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {!disableInteraction && suggestions.length > 0 && (
        <Paper style={{ position: "absolute", top: "50px", left: 0, right: 0, zIndex: 10 }}>
          <List>
            {suggestions.map((suggestion, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={suggestion === "Searching..."}
                >
                  <ListItemText
                    primary={suggestion.display_name || suggestion}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
};

export default AddressSearch;
