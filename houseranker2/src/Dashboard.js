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
  const [sliderValues, setSliderValues] = useState([1, 1, 1]); // Initial sliders
  const [entries, setEntries] = useState([]); // Entries for the table
  const [isNewHouseOpen, setIsNewHouseOpen] = useState(false); // Modal state for adding new entry
  const [newEntry, setNewEntry] = useState({
    Link: '',
    Description: '',
    Address: '',
    Typology: '',
    SqMeters: '',
    Price: '',
  });
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [isNewPointOpen, setIsNewPointOpen] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(null); // To track if editing an existing point
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');

  const [sliders, setSliders] = useState([0, 0, 0]);
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
    const newPoint = { name, address, importance: sliders };

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

  const handleNewEntryChange = (field, value) => {
    setNewEntry(prev => ({ ...prev, [field]: value }));
  };

  const addNewEntry = () => {
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    setNewEntry({ Link: '', Description: '', Address: '', Typology: '', SqMeters: '', Price: '' });
    setIsNewHouseOpen(false);
    saveUserData({ sliderValues, pointsOfInterest, entries:newEntries });

  };

    const renderTableHeaders = () => {
        const baseHeaders = [
            'Link',
            'Description',
            'Address',
            'Price',
            'Typology',
            'Sq Meters',
        ];
        
        const interestPointHeaders = pointsOfInterest.flatMap(point => [
            `Walking to ${point.name}`,
            `Driving to ${point.name}`,
            `Commute to ${point.name}`,
        ]);
        
        return [...baseHeaders, ...interestPointHeaders, 'Score'].map((header, index) => (
            <th key={index} style={{ textAlign: 'left' }}>{header}</th>
        ));
    };

    const renderTableRows = () => {
        return entries.map((entry, rowIndex) => {
            // Calculate scores (or placeholder values) for each point of interest
            const scores = pointsOfInterest.flatMap(point => [
                point.importance[0], // Walking importance
                point.importance[1], // Driving importance
                point.importance[2], // Commute importance
            ]);
    
            return (
                <tr key={rowIndex}>
                    <td>{entry.Link}</td>
                    <td>{entry.Description}</td>
                    <td>{entry.Address}</td>
                    <td>{entry.Price}</td>
                    <td>{entry.Typology}</td>
                    <td>{entry.SqMeters}</td>
                    {scores.map((score, index) => (
                        <td key={index}>{score}</td>
                    ))}
                    <td>{/* Placeholder for overall score */}</td>
                </tr>
            );
        });
    };
    

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
                                <div className="importance-ring" data-importance={imp}>
                                  <span className="importance-value">{imp}</span> {/* Display the importance value */}
                                </div>
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
                <tr>
                    {renderTableHeaders()}
                </tr>
            </thead>
            <tbody>
                {entries.length === 0 ? (
                    <tr>
                        <td colSpan="7" style={{ textAlign: 'center' }}>No entries available.</td>
                    </tr>
                ) : (
                    renderTableRows()
                )}
            </tbody>
        </table>
        <Button variant="contained" onClick={() => setIsNewHouseOpen(true)}>Add New Entry</Button>

      </div>

      {/* Modal for Adding New Entry */}
      <Modal open={isNewHouseOpen} onClose={() => setIsNewHouseOpen(false)}>
        <Box sx={{ padding: '20px', backgroundColor: 'white', width: '300px', margin: 'auto', marginTop: '10vh' }}>
          <Typography variant="h6">Add New Entry</Typography>
          {['Link', 'Description', 'Address', 'Typology', 'SqMeters', 'Price'].map(field => (
            <TextField
              key={field}
              label={field}
              value={newEntry[field]}
              onChange={(e) => handleNewEntryChange(field, e.target.value)}
              fullWidth
              margin="normal"
            />
          ))}
          <Button variant="contained" onClick={addNewEntry}>Save</Button>
        </Box>
      </Modal>
      {/* Modal for adding/editing point of interest */}
      <Modal open={isNewPointOpen} onClose={() => setIsNewPointOpen(false)}>
        <Box className="modal-box">
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
            fullWidth
            margin="normal"
          />
          <Typography>Walking Distance Importance</Typography>
          <Slider value={sliders[0]} onChange={(e, v) => setSliders([v, sliders[1], sliders[2]])} min={0} max={5} step={1} marks />
          <Typography>Transport Distance Importance</Typography>
          <Slider value={sliders[1]} onChange={(e, v) => setSliders([sliders[0], v, sliders[2]])} min={0} max={5} step={1} marks />
          <Typography>Driving Distance Importance</Typography>
          <Slider value={sliders[2]} onChange={(e, v) => setSliders([sliders[0], sliders[1], v])} min={0} max={5} step={1} marks />
          <Button onClick={savePointOfInterest}>Save</Button>
          <Button onClick={() => setIsNewPointOpen(false)}>Cancel</Button>
          {currentPoint && (
            <button className = "delete-button" onClick={deletePointOfInterest} >
              Delete
            </button>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default Dashboard;
