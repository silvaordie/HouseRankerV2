import React, { useState, useEffect } from "react";

const ButtonSelector = ({ title = "Coziness", value = 0, onChange }) => {
    const [activeButton, setActiveButton] = useState(value);
    
    // Update the selected button when the component is mounted or when the prop changes
    useEffect(() => {
        if (value && value >= 0 && value <= 5) {
            setActiveButton(value);
        } else {
            setActiveButton(0); // Default to 0 if invalid or undefined
        }
        onChange({ target: { value: value } });
    }, [value]);

    const handleButtonClick = (buttonValue) => {
        setActiveButton(buttonValue);
        if (onChange) {
            onChange({ target: { value: buttonValue } }); // Simulate an event-like object
          }
    };

    return (
        <div>
            <div style={{ textAlign: "left", marginLeft: "5px" }}>
                <label
                    style={{
                        display: "block",
                        fontSize: "1rem",
                        color: "rgba(0, 0, 0, 0.6)", // Match Material-UI input label color
                        fontWeight: "400",
                        marginBottom: "0.5rem",
                    }}
                >
                    {title}
                </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                {Array.from({ length: 6 }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => handleButtonClick(index)}
                        style={{
                            padding: "10px 22px",
                            borderRadius: "5px",
                            border: `2px solid ${activeButton === index ? "#1976d2" : "lightgrey"}`,
                            backgroundColor: activeButton === index ? "#1976d2" : "white",
                            color: activeButton === index ? "white" : "grey",
                            cursor: "pointer",
                            fontSize: "16px",
                        }}
                    >
                        {index}
                    </button>
                ))}
            </div>

        </div>
    );
};

export default ButtonSelector;
