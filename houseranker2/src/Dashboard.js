// Dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';
//import { useNavigate } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { db } from "./firebase"; // Import the Firestore instance
import { updateDoc, doc, getDoc, FieldValue  } from "firebase/firestore"; // Import Firestore functions
import { useAuth } from "./AuthContext"; // Import your custom auth hook/context provider

const Dashboard = () => {
  //const navigate = useNavigate();
  const { currentUser } = useAuth(); // Access currentUser directly from context

  const fetchData = useCallback(async () => {
    if (currentUser) { // Ensure currentUser is defined

      try {
        const userDocRef = doc(db, "users", currentUser.uid); // Reference to the user's document
        const userDoc = await getDoc(userDocRef); // Fetch the document
        const data = userDoc.data();

        // Populate state with fetched data
        if (data) {
          setSliderValues(data.sliderValues || [1, 1, 1, 1]);
          setPointsOfInterest(data.pointsOfInterest || {});
          setEntries(data.entries || {});
        }
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      } finally {
      }
    }
  }, [currentUser]);

  useEffect(() => {  
      fetchData();
  }, [ fetchData]);

  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0]); // Initial sliders
  const [entries, setEntries] = useState({}); // Entries for the table
  const [isNewHouseOpen, setIsNewHouseOpen] = useState(false); // Modal state for adding new entry

  const [pointsOfInterest, setPointsOfInterest] = useState({});
  const [isNewPointOpen, setIsNewPointOpen] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(null); // To track if editing an existing point

  const [address, setAddress] = useState('');
  const [name, setName] = useState('');

  const [sliders, setSliders] = useState([0, 0, 0]);
  const [maxs, setMaxs] = useState([0, 0, 0]);
  const [currentEntry, setCurrentEntry] = useState(null); // For both adding and editing
  const [isEditing, setIsEditing] = useState(false);


  const saveUserData = async (updatedData) => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);

        // Set the document with merge: true to update only specified fields or create if doesn't exist

        await updateDoc(userDocRef, updatedData);
        console.log("User data updated or created successfully!");
      } catch (error) {
        console.error("Error updating or creating user data:", error.message);
      }
    } else {
      console.error("No current user found");
    }
  };
  const delUserData = async (updatedData) => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);

        // Set the document with merge: true to update only specified fields or create if doesn't exist

        userDocRef.update( {
          updatedData: FieldValue.delete(),
        });
        console.log(updatedData)

        console.log("User data updated or created successfully!");
      } catch (error) {
        console.error("Error updating or creating user data:", error.message);
      }
    } else {
      console.error("No current user found");
    }
  };

  // Open modal for adding or editing
  const openModal = (point = null) => {
    if (point) {
      setAddress(point);
      setSliders(pointsOfInterest[point].importance);
      setName(pointsOfInterest[point].name);
      if (pointsOfInterest[point].maxs) { setMaxs(pointsOfInterest[point].maxs) }
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
    const newPoint = { name, importance: sliders, maxs };
    let updatedPointsOfInterest = { ...pointsOfInterest };  // Create a new object
    if (currentPoint) {
      updatedPointsOfInterest[address] = newPoint;  // Edit existing point
    } else {
      updatedPointsOfInterest[address] = newPoint;  // Add new point
    }
    setPointsOfInterest(updatedPointsOfInterest);  // Update state
    saveUserData({ pointsOfInterest: updatedPointsOfInterest });
    setIsNewPointOpen(false);
  };

  // Delete point of interest
  const deletePointOfInterest = () => {
    if (currentPoint) {
      let updatedPointsOfInterest = { ...pointsOfInterest };  // Create a new object
      delete updatedPointsOfInterest[currentPoint];  // Remove point
      setPointsOfInterest(updatedPointsOfInterest);  // Update state
      saveUserData({ pointsOfInterest: updatedPointsOfInterest});
    }
    setIsNewPointOpen(false);
  };
  
  // Function to handle slider value change
  const handleSliderChange = (index, value) => {
    const updatedSliders = [...sliderValues];
    updatedSliders[index] = value;
    setSliderValues(updatedSliders);
    saveUserData({ sliderValues: updatedSliders });
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
      'Size',
    ];
  
    // First header row with only point of interest names and addresses
    const interestPointHeaders = Object.entries(pointsOfInterest).map(([point, value], index) => (
      <th key={index} colSpan="3" style={{ textAlign: 'center' }}>
        <div>{pointsOfInterest[point].name}</div>
        <span style={{ fontSize: 'smaller', color: 'grey' }}>{point}</span>
      </th>
    ));
  
    // Second header row with base headers and repeated distance headers
    const distanceHeaders = Object.entries(pointsOfInterest).flatMap(() => [
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
          <th colSpan={1} /> {/* Empty cell for 'Score' column */}
        </tr>
  
        {/* Second row: Base headers and repeated distance headers */}
        <tr>
          {baseHeaders.map((header, index) => (
            <th key={index} style={{ textAlign: 'left' }}>
              {header}
            </th>
          ))}
          {distanceHeaders.map((header, index) => (
            <th key={index} style={{ textAlign: 'center' }}>
              <i
                className={"fas fa-" + icons[index % 3]}
                style={{ marginRight: '5px' }}
                title={header} // Updated to use the header for the title
              />
            </th>
          ))}
          <th>Score</th> {/* Final column header for 'Score' */}
        </tr>
      </React.Fragment>
    );
  };
  

  const renderTableRows = () => {
    return Object.entries(entries).map(([link, entry], rowIndex) => {

      // Generate the data cells for the base headers
      const baseDataCells = [
        <td key="link"><a href={link} target="_blank" rel="noopener noreferrer">{link} </a> </td>,
        <td key="address">{entry.Address}</td>,
        <td key="description">{entry.Description}</td>,
        <td key="price">{entry.Price}</td>,
        <td key="typology">{entry.Typology}</td>,
        <td key="sqMeters">{entry.Size}</td>,
      ];

      // Generate the distance data cells for each point of interest
      const interestPointDataCells = Object.entries(pointsOfInterest).map(([link, point], index) => {
        return [
          <td key={`walking-${index}`} style={{ textAlign: 'center' }}>
            {point.importance[0] ? `${point.importance[0]} mins` : '-'}
          </td>,
          <td key={`driving-${index}`} style={{ textAlign: 'center' }}>
            {point.importance[1] ? `${point.importance[1]} mins` : '-'}
          </td>,
          <td key={`transport-${index}`} style={{ textAlign: 'center' }}>
            {point.importance[2] ? `${point.importance[2]} mins` : '-'}
          </td>
        ];
      });      

      return (
        <tr
          key={rowIndex}
          onClick={() => openEditEntryModal(entry)}
          style={{ cursor: 'pointer', backgroundColor: rowIndex % 2 === 0 ? '#f9f9f9' : '#fff' }} // Alternating row colors
        >
          {baseDataCells}
          {interestPointDataCells}
          <td>{entry.Score}</td>
        </tr>
      );
    });
  };

  const handleDeleteEntry = () => {
    //if (!currentEntry) return; // Exit the function if currentEntry is null or undefined
    delete entries[currentEntry.Link];
    setEntries(entries); // Update the entries array
    setCurrentEntry(null); // Reset current entry after deletion
    setIsNewHouseOpen(false); // Close the modal after deletion
    console.log(`entries.${currentEntry.Link}`)
    saveUserData({entries:entries});
  };

  const openAddEntryModal = () => {
    setCurrentEntry({ Link: '', Description: '', Address: '', Typology: '', Size: '', Price: '', Score: 0 });
    setIsEditing(false);
    setIsNewHouseOpen(true);
  };

  // Open modal for editing an entry, ensuring `currentEntry` is defined
  const openEditEntryModal = (entry) => {
    console.log(entries)
    setCurrentEntry(entry || { Link: '', Description: '', Address: '', Typology: '', Size: '', Price: '', Score: 0 });
    setIsEditing(true);
    setIsNewHouseOpen(true);
  };

  // Update function for input fields in the modal
  const handleNewEntryChange = (field, value) => {
    setCurrentEntry(prev => ({ ...prev, [field]: value }));
  };

  const saveOrUpdateEntry = () => {
    if (currentEntry) {
        entries[currentEntry.Link] = {"Link":currentEntry.Link, "Address":currentEntry.Address, "Description":currentEntry.Description , "Price":currentEntry.Price ,"Typology":currentEntry.Typology,"Size":currentEntry.Size}
        saveUserData({ entries:entries });
    }
    setIsNewHouseOpen(false); // Close the modal
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
              Object.entries(pointsOfInterest).map(([point, value], index) => (
                <div key={index} className="point-entry">
                  <div className="point-info">
                    <span className="point-name">{pointsOfInterest[point].name}</span>
                    <span className="point-address">{point}</span>
                  </div>
                  <div className="importance-indicators">
                    {pointsOfInterest[point].importance.map((imp, i) => (
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
                            {pointsOfInterest[point].maxs[i] || 0} mins
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
            {Object.entries(entries).length === 0 ? (
              <tr>
                <td colSpan={7 + Object.entries(pointsOfInterest).length * 3} style={{ textAlign: 'center' }}>No entries available.</td>
              </tr>
            ) : (
              renderTableRows()
            )}
          </tbody>

        </table>
        <Button variant="contained" onClick={() => { openAddEntryModal() }}>Add New Entry</Button>

      </div>

      {/* Modal for Adding New Entry */}
      <Modal open={isNewHouseOpen} onClose={() => setIsNewHouseOpen(false)}>
        <Box className="modal-box" style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">{isEditing ? 'Edit Entry' : 'Add New Entry'}</Typography>
          {['Link', 'Address', 'Description', 'Typology', 'Size', 'Price'].map(field => (
            <TextField
              key={field}
              label={field}
              value={(currentEntry && currentEntry[field]) || ''} // Show currentEntry values
              disabled={isEditing && (field === "Link" || field === "Address")}
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
            disabled={currentPoint}
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
