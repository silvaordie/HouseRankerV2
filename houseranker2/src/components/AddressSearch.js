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
          addressdetails: 1, // Request detailed address components
          limit: 5,
        },
      });

      // Map the response to extract only the basic address fields
      const formattedSuggestions = response.data.map((item) => {
        const { address } = item;

        return {
          street: address.road || null,
          door: address.house_number || null,
          city: address.city || address.town || address.village || null,
          postalCode: address.postcode || null,
          country: address.country || null,
          displayName: item.display_name, // For debugging or showing full address
          latitude: item.lat,
          longitude: item.lon,
        };
      });

      setSuggestions(formattedSuggestions); // Store the formatted results
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
    // Create simplified address string
    const simplifiedAddress = [
      suggestion.door ? suggestion.door : "",
      suggestion.street || "",
      suggestion.city || "",
      suggestion.postalCode || "",
      suggestion.country || ""
    ]
      .filter(Boolean) // Remove any empty strings
      .join(", "); // Join with commas

    const geolocation = {
      lat: suggestion.latitude,
      lon: suggestion.longitude,
    };

    setQuery(simplifiedAddress); // Update input with the simplified address
    setSuggestions([]); // Clear suggestions

    // Send both the simplified address and geolocation to the parent component
    if (onChange) {
      onChange(simplifiedAddress, geolocation); // Pass simplified address and geolocation
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

            {isSearching ? (
              <ListItem disablePadding>
                <ListItemText primary="Searching..." />
              </ListItem>
            ) : (
              suggestions.map((suggestion, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isSearching}
                  >
                    <ListItemText
                      primary={`${suggestion.door ? suggestion.door + " " : ""}${suggestion.street || ""} ${suggestion.city || ""} ${suggestion.postalCode || ""} ${suggestion.country || ""}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      )}
    </div>
  );
};

export default AddressSearch;
