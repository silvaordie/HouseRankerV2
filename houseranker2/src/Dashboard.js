// Dashboard.js
import React, { useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
        navigate('/'); // Redirect to login if token is missing
        } else {
        // Proceed with data fetching
        fetchData();
        }
    }, [navigate]);
  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0]); // Initial sliders
  const [entries, setEntries] = useState([]); // Entries for the table
  const [isNewHouseOpen, setIsNewHouseOpen] = useState(false); // Modal state for adding new entry
  const [newEntry, setNewEntry] = useState({
    Link: '',
    Description: '',
    Address: '',
    Typology: '',
    SqMeters: '',
    Price: '',
    Score: 0
  });
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [isNewPointOpen, setIsNewPointOpen] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(null); // To track if editing an existing point
  
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');

  const [sliders, setSliders] = useState([0, 0, 0]);
  const [maxs, setMaxs] = useState([0, 0, 0]);
    const [currentEntry, setCurrentEntry] = useState(null); // For both adding and editing
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        const response = await fetch('http://localhost:5000/api/user/', {
            headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Populate state with fetched data
      if(data)
      {
        setSliderValues(data.sliderValues || [1, 1, 1, 1]);
        setPointsOfInterest(data.pointsOfInterest || []);
        setEntries(data.entries || []);
      }
    }
  };
  const saveUserData = async (updatedData) => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:5000/api/user/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    });
  };
  

  // Open modal for adding or editing
  const openModal = (point = null) => {
    if (point) {
      setAddress(point.address);
      setSliders(point.importance);
      setName(point.name);
      if(point.maxs)
        {setMaxs(point.maxs)}
      setCurrentPoint(point);
    } else {
      setAddress('');
      setSliders([0, 0, 0]);
      setCurrentPoint(null);
    }
    setIsNewPointOpen(true);
  };

  // Save point of interest
  const savePointOfInterest = () => {
    const newPoint = { name, address, importance: sliders, maxs };

    if (currentPoint) {
      // Edit existing point
      const newPOI = pointsOfInterest.map((point) => (point === currentPoint ? newPoint : point));
      setPointsOfInterest(newPOI);
      saveUserData({ sliderValues, pointsOfInterest: newPOI, entries });

    } else {
      // Add new point
      const newPOI = [...pointsOfInterest, newPoint];
      setPointsOfInterest(newPOI);
      saveUserData({ sliderValues, pointsOfInterest: newPOI, entries });
    }
    renderTableRows();
    setIsNewPointOpen(false);
  };

    // Delete point of interest
    const deletePointOfInterest = () => {
        if (currentPoint) {
            const newPOI = pointsOfInterest.filter((point) => point !== currentPoint);
          setPointsOfInterest(newPOI);
          saveUserData(newPOI);
        }
        setIsNewPointOpen(false);
      };
    // Function to handle slider value change
    const handleSliderChange = (index, value) => {
        const updatedSliders = [...sliderValues];
        updatedSliders[index] = value;
        setSliderValues(updatedSliders);
        saveUserData({ sliderValues: updatedSliders, pointsOfInterest, entries });
      };


/*  const addNewEntry = () => {
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    setNewEntry({ Link: '', Description: '', Address: '', Typology: '', SqMeters: '', Price: '', Score: 0 });
    setIsNewHouseOpen(false);
    saveUserData({ sliderValues, pointsOfInterest, entries:newEntries });
  };

const updateEntry = () => {
    // Logic to update an existing entry
    const updatedEntries = entries.map(entry =>
        entry.Link === currentEntry.Link ? currentEntry : entry
    );
    setEntries(updatedEntries); // Update the entries array
    setCurrentEntry(null); // Reset current entry after updating
};*/

  const renderTableHeaders = () => {
    const baseHeaders = [
        'Link',
        'Address',
        'Description',
        'Price',
        'Typology',
        'Sq Meters',
    ];

    // First header row with only point of interest names and addresses
    const interestPointHeaders = pointsOfInterest.map((point, index) => (
        <th key={index} colSpan="3" style={{ textAlign: 'center' }}>
            {point.name}
            <br />
            <span style={{ fontSize: 'smaller', color: 'grey' }}>{point.address}</span>
        </th>
    ));

    // Second header row with base headers and repeated distance headers
    const distanceHeaders = pointsOfInterest.flatMap(() => [
        'Walking Duration',
        'Driving Duration',
        'Transport Duration',
    ]);

    return (
        <React.Fragment>
            {/* First row: Point of interest names and addresses */}
            <tr>
                <th colSpan={baseHeaders.length} /> {/* Spacer for base headers */}
                {interestPointHeaders}
                <th /> {/* Empty cell for 'Score' column */}
            </tr>
            {/* Second row: Base headers and repeated distance headers */}
            <tr>
                {baseHeaders.map((header, index) => (
                    <th key={index} style={{ textAlign: 'left' }}>{header}</th>
                ))}
                {distanceHeaders.map((header, index) => (
                    <th key={index} style={{ textAlign: 'center' }}>        <i className={"fas fa-" + icons[index%3]} style={{ marginRight: '5px' }} title="Walking Duration"></i>
                    </th>
                ))}
                <th>Score</th> {/* Final column header for 'Score' */}
            </tr>
        </React.Fragment>
    );
};
const handleDeleteEntry = () => {
    //if (!currentEntry) return; // Exit the function if currentEntry is null or undefined

    const updatedEntries = entries.filter(entry => entry.Link !== currentEntry.Link);
    setEntries(updatedEntries); // Update the entries array
    setCurrentEntry(null); // Reset current entry after deletion
    setIsNewHouseOpen(false); // Close the modal after deletion
    saveUserData({ sliderValues, pointsOfInterest, entries:updatedEntries });
};

const renderTableRows = () => {
    return entries.map((entry, rowIndex) => {
        
        // Generate the data cells for the base headers
        const baseDataCells = [
            <td key="link"><a href={entry.Link} target="_blank" rel="noopener noreferrer">{entry.Link} </a> </td>,
            <td key="address">{entry.Address}</td>,
            <td key="description">{entry.Description}</td>,
            <td key="price">{entry.Price}</td>,
            <td key="typology">{entry.Typology}</td>,
            <td key="sqMeters">{entry.SqMeters}</td>,
        ];

        // Generate the distance data cells for each point of interest
        const interestPointDataCells = pointsOfInterest.flatMap((point, pointIndex) => [
            <td key={`walking-${pointIndex}`} style={{ textAlign: 'center' }}>{point.importance[0] + " mins" || '-'}</td>,
            <td key={`driving-${pointIndex}`} style={{ textAlign: 'center' }}>{point.importance[1] + " mins"|| '-'}</td>,
            <td key={`transport-${pointIndex}`} style={{ textAlign: 'center' }}>{point.importance[2] + " mins"|| '-'}</td>,
        ]);

        return (
                    <tr
                        key={rowIndex}
                        onClick={() => {
                            openEditEntryModal(entry);
                        }}
                        style={{ cursor: 'pointer', backgroundColor: rowIndex % 2 === 0 ? '#f9f9f9' : '#fff' }} // Alternating row colors
                    >
                {/* Render empty cells for alignment with the name/address header row */}

                {/* Render base data cells under the base headers */}
                {baseDataCells}
                {/* Render the interest point distance data under the dynamic headers */}
                {interestPointDataCells}
                {/* Finally, render the Score cell */}
                <td>{entry.Score}</td>
            </tr>
        );
    });
};

const openAddEntryModal = () => {
    setCurrentEntry({ Link: '', Description: '', Address: '', Typology: '', SqMeters: '', Price: '', Score: 0 });
    setIsEditing(false);
    setIsNewHouseOpen(true);
};

// Open modal for editing an entry, ensuring `currentEntry` is defined
const openEditEntryModal = (entry) => {
    setCurrentEntry(entry || { Link: '', Description: '', Address: '', Typology: '', SqMeters: '', Price: '', Score: 0 });
    setIsEditing(true);
    setIsNewHouseOpen(true);
};

// Update function for input fields in the modal
const handleNewEntryChange = (field, value) => {
    setCurrentEntry(prev => ({ ...prev, [field]: value }));
};

const saveOrUpdateEntry = () => {
    if (isEditing && currentEntry) {
        // Update the existing entry
        const updatedEntries = entries.map(entry =>
            entry.Link === currentEntry.Link ? currentEntry : entry
        );
        setEntries(updatedEntries);
        saveUserData({ sliderValues, pointsOfInterest, entries:updatedEntries });
    } else if (currentEntry) {
        // Add a new entry
        const newEntries = [...entries, currentEntry]
        setEntries(newEntries);
        saveUserData({ sliderValues, pointsOfInterest, entries:newEntries });
    }
    setIsNewHouseOpen(false); // Close the modal
    saveUserData()
};

    const colors = ["#db284e", "#db284e", "#db8829", "#c9db29", "#4caf50", "#007bff"]
    const icons = ["person-walking", "train", "car"]
  return (
    <div className="dashboard-container">
    {/* Header Section */}
    <div className="top-container">
        
        {/* Sliders Section */}
        <div className="slider-container">
        <Typography variant="h6">Importance</Typography> 
          {[...["Price", "Squared Meter area", "Tipology", "Coziness"]].map((name, i) => (
            <div key={i}>
              <Typography>{name}</Typography>
              <Slider
                value={sliderValues[i]}
                onChange={(e, newValue) => handleSliderChange(i, newValue)}
                min={0}
                max={5}
                step={1}
                marks
              />
            </div>
          ))}
        </div>

        <div className="list-map-container">
            {/* List Section */}
            <div className="dynamic-list">
                <Typography variant="h6">Points of interest</Typography>
                {pointsOfInterest.length === 0 ? (
                <p>You have no points of interest</p>
                ) : (
                    pointsOfInterest.map((point, index) => (
                        <div key={index} className="point-entry">
                          <div className="point-info">
                                <span className="point-name">{point.name}</span>
                                <span className="point-address">{point.address}</span>
                            </div>
                            <div className="importance-indicators">
                                {point.importance.map((imp, i) => (
                                    <div key={i} className="importance-circle">
                                    <svg viewBox="0 0 36 36" className="circular-chart orange">
                                        <path
                                        className="circle-bg"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                        className="circle"
                                        strokeDasharray={`${imp * 20}, 100`}
                                        style={{ stroke: colors[imp] }}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        
                                        {/* Font Awesome icon inside foreignObject */}
                                        <foreignObject x="9" y="9" width="18" height="18">
                                        <i
                                            className={"fa fa-" + icons[i]}
                                            style={{
                                            color: colors[imp],
                                            fontSize: '12px',
                                            display: 'block',
                                            textAlign: 'center',
                                            }}
                                        />
                                        </foreignObject>
                                        
                                        {/* Display the max value closer to the icon */}
                                        <text x="18" y="26" textAnchor="middle" fill={colors[imp]} fontSize="6">
                                        {point.maxs[i] || 0} mins
                                        </text>
                                    </svg>
                                    </div>
                                ))}
                                </div>


                          <button onClick={() => openModal(point)}>Edit Interest Point</button>
                        </div>
                      )))}
                <button onClick={() => openModal()} className="add-point-button">
                    Add Point of Interest
                </button>
                
            </div>
                    {/* Map Section */}
            <div className="map-container">
            <Typography variant="h6" style={{ textAlign: 'center' }}></Typography>
            <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </MapContainer>
            </div>
        </div>


      </div>
      {/* Main Section - Dynamic Table */}
      <div className="bottom-list-container">
        <Typography variant="h6">Main Table</Typography>
        <table className="rounded-table">
            <thead>
                    {renderTableHeaders()}
            </thead>
            <tbody>
                {entries.length === 0 ? (
                    <tr>
                        <td colSpan={7 + pointsOfInterest.length * 3} style={{ textAlign: 'center' }}>No entries available.</td>
                    </tr>
                ) : (
                    renderTableRows()
                )}
            </tbody>
        </table>
        <Button variant="contained" onClick={() => {openAddEntryModal()}}>Add New Entry</Button>

      </div>

      {/* Modal for Adding New Entry */}
      <Modal open={isNewHouseOpen} onClose={() => setIsNewHouseOpen(false)}>
        <Box className="modal-box" style={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6">{isEditing ? 'Edit Entry' : 'Add New Entry'}</Typography>
            {['Link',  'Address','Description', 'Typology', 'SqMeters', 'Price'].map(field => (
                <TextField
                    key={field}
                    label={field}
                    value={(currentEntry && currentEntry[field]) || ''} // Show currentEntry values
                    disabled = {isEditing && (field === "Link" || field === "Address")}
                    onChange={(e) => handleNewEntryChange(field, e.target.value)}
                    fullWidth
                    margin="normal"
                />
            ))}

            <Box marginTop={2}>
                <Button onClick={saveOrUpdateEntry}>
                    {isEditing ? 'Update' : 'Save'}
                </Button>
                {isEditing && (
                    <Button color="secondary" onClick={handleDeleteEntry}>
                        Delete
                    </Button>
                )}
            </Box>
        </Box>
    </Modal>


    {/* Modal for adding/editing point of interest */}
    <Modal open={isNewPointOpen} onClose={() => setIsNewPointOpen(false)}>
  <Box className="modal-box" style={{ display: 'flex', flexDirection: 'column' }}>
    <Typography variant="h6">{currentPoint ? 'Edit' : 'Add'} Point of Interest</Typography>
    
    <TextField
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Name"
      fullWidth
      margin="normal"
    />
    
    <TextField
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="Address"
      disabled = {currentPoint}
      fullWidth
      margin="normal"
    />

    {/* Slider and Max Input for Walking Distance */}
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ flex: 1 }}>
        <Typography>Walking Distance Importance</Typography>
        <Slider
          value={sliders[0]}
          onChange={(e, v) => setSliders([v, sliders[1], sliders[2]])}
          min={0}
          max={5}
          step={1}
          marks
        />
      </div>
      <div style={{ marginLeft: '20px', textAlign: 'center' }}>
        <Typography>Max</Typography>
        <input
          type="number"
          style={{ width: '60px' }}
          value={maxs[0]}
          placeholder="mins"
          onChange={(e) => setMaxs([parseInt(e.target.value) || 0, maxs[1], maxs[2]])}
        />
      </div>
    </div>

    {/* Slider for Transport Distance */}
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ flex: 1 }}>
        <Typography>Transport Distance Importance</Typography>
        <Slider
          value={sliders[1]}
          onChange={(e, v) => setSliders([sliders[0], v, sliders[2]])}
          min={0}
          max={5}
          step={1}
          marks
        />
      </div>
      <input
        type="number"
        style={{ width: '60px', marginLeft: '20px' }}
        value={maxs[1]}
        placeholder="mins"
        onChange={(e) => setMaxs([maxs[0], parseInt(e.target.value) || 0, maxs[2]])}
      />
    </div>

    {/* Slider for Driving Distance */}
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <Typography>Driving Distance Importance</Typography>
        <Slider
          value={sliders[2]}
          onChange={(e, v) => setSliders([sliders[0], sliders[1], v])}
          min={0}
          max={5}
          step={1}
          marks
        />
      </div>
      <input
        type="number"
        style={{ width: '60px', marginLeft: '20px' }}
        value={maxs[2]}
        placeholder="mins"
        onChange={(e) => setMaxs([maxs[0], maxs[1], parseInt(e.target.value) || 0])}
      />
    </div>

    {/* Buttons */}
    <Box marginTop={2}>
      <Button onClick={savePointOfInterest}>Save</Button>
      <Button onClick={() => setIsNewPointOpen(false)}>Cancel</Button>
      {currentPoint && (
        <button className="delete-button" onClick={deletePointOfInterest}>
          Delete
        </button>
      )}
    </Box>
  </Box>
</Modal>



    </div>
  );
};

export default Dashboard;
