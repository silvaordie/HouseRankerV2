// Dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';
//import { useNavigate } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { db } from "./firebase"; // Import the Firestore instance
import { updateDoc, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore"; // Import Firestore functions
import { useAuth } from "./AuthContext"; // Import your custom auth hook/context provider
import AddressSearch from "./AddressSearch";
import MapComponent from './MapComponent';  // Import MapComponent
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
//import { calculateDistance } from '../functions';

const Dashboard = () => {
  //const navigate = useNavigate();
  const { currentUser } = useAuth(); // Access currentUser directly from context
  const [userStats, setUserStats] = useState({});
  const [userMaxs, setUserMaxs] = useState({});
  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0]); // Initial sliders
  const [entries, setEntries] = useState({}); // Entries for the table
  const [isNewHouseOpen, setIsNewHouseOpen] = useState(false); // Modal state for adding new entry

  const [pointsOfInterest, setPointsOfInterest] = useState({});
  const [isNewPointOpen, setIsNewPointOpen] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(null); // To track if editing an existing point

  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [geolocation, setGeolocation] = useState({ lat: null, lon: null });
  const [sliders, setSliders] = useState({ "Size": 0, "Typology": 0, "Price": 0, "Coziness": 0 });
  const [poiSliders, setPoiSliders] = useState({ "walking": 0, "car": 0, "transport": 0 });
  const [maxs, setMaxs] = useState([0, 0, 0, 0]);
  const [currentEntry, setCurrentEntry] = useState(null); // For both adding and editing
  const [isEditing, setIsEditing] = useState(false);
  const [distances, setDistances] = useState({});

  const updateUserData = async () => {
    if (currentUser) { // Ensure currentUser is defined
      try {
        const userDocRef = doc(db, "users_entries", currentUser.uid); // Reference to the user's document
        const userDoc = await getDoc(userDocRef); // Fetch the document
        let data = userDoc.data();
        setSliderValues(data.sliderValues || { "Size": 0, "Typology": 0, "Price": 0, "Coziness": 0 });
        setUserMaxs(data.maxs || {});
        setUserStats(data.stats || {});
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      } finally {
      }
    }
  };
  useEffect(() => {
    const getDistanceBetween = async (entryId, poiId, method) => {
      const docRef = doc(db, "distances", entryId);
      const docSnapshot = await getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        try {
          await setDoc(docRef, {});
        } catch (error) {
          console.log(error.message);
        }
      }
  
      const docData = docSnapshot.data();
  
      if (docData && docData[poiId]) {
        // When the data is already present in Firestore, update distances state correctly
        setDistances(prevDistances => ({
          ...prevDistances,
          [entryId]: {
            ...prevDistances[entryId],
            [poiId]: docData[poiId],
          },
        }));
      } else {
        const functions = getFunctions(); // Get the functions instance
        connectFunctionsEmulator(functions, "localhost", 5001);  // Make sure emulator is running
        const checkPoint = httpsCallable(functions, "calculateDistance");
  
        const result = await checkPoint({ entryId, poiId });
  
        // When the result is fetched, update the distances state
        setDistances(prevDistances => ({
          ...prevDistances,
          [entryId]: {
            ...prevDistances[entryId],
            [poiId]: result.data,
          },
        }));
  
        // Save the result to Firestore
        await setDoc(docRef, { [poiId]: result.data }, { merge: true });
      }
    };
  
    // Iterate over entries and points of interest
    Object.keys(entries).forEach(entryId => {
      Object.keys(pointsOfInterest).forEach(poiId => {
        getDistanceBetween(entryId, poiId);
      });
    });
  }, [pointsOfInterest, entries]);
  

  const fetchData = useCallback(async () => {
    if (currentUser) { // Ensure currentUser is defined
      //const result = checkPoint({ entryId:"1", poiId:"37, Spalentorweg, Am Ring, Grossbasel, Basel, Basel-City, 4051, Switzerland" });

      try {
        const userDocRef = doc(db, "users_entries", currentUser.uid); // Reference to the user's document
        const userDoc = await getDoc(userDocRef); // Fetch the document
        let data = userDoc.data();
        setSliderValues(data.sliderValues || { "Size": 0, "Typology": 0, "Price": 0, "Coziness": 0 });
        setUserMaxs(data.maxs || {});
        setUserStats(data.stats || {});

        ["entries", "pointsOfInterest"].forEach(async (typ) => {
          const collectionRef = collection(db, `users_${typ}/${currentUser.uid}/${typ}`);
          const querySnapshot = await getDocs(collectionRef);
          let jsonResult = {};

          if (typ === "entries") {
            querySnapshot.forEach((doc) => {
              jsonResult[doc.id] = { "info": doc.data() };
            });
            setEntries(jsonResult || {});
          }
          else {
            const poiCollectionRef = collection(db, "pointsOfInterest");

            for (const userPOIDoc of querySnapshot.docs) {
              const poiId = userPOIDoc.id; // ID corresponds to the key in the main POI collection
              const userPOIData = userPOIDoc.data();

              // Fetch geolocation data from the main POI collection
              const poiDocRef = doc(poiCollectionRef, poiId);
              const poiDocSnapshot = await getDoc(poiDocRef);

              if (poiDocSnapshot.exists()) {
                const poiData = poiDocSnapshot.data();
                // Merge user's POI data with the geolocation data
                jsonResult[poiId] = {
                  ...userPOIData,
                  geolocation: poiData.geoloc, // Include geolocation
                };

              } else {
                console.warn(`POI with ID ${poiId} does not exist in the main collection.`);
              }
            }
            setPointsOfInterest(jsonResult || {});
          }
        })
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      } finally {
      }

    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveUserData = async (updatedData) => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users_entries", currentUser.uid);

        // Set the document with merge: true to update only specified fields or create if doesn't exist

        await updateDoc(userDocRef, updatedData, { merge: true });
        console.log("User data updated or created successfully!");
      } catch (error) {
        console.error("Error updating or creating user data:", error.message);
      }
    } else {
      console.error("No current user found");
    }
  };
  const delUserData = async (document, key) => {
    if (currentUser) {
      try {
        const docRef = doc(db, `users_${document}/${currentUser.uid}/${document}/${key}`);

        await deleteDoc(docRef);
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    } else {
      console.error("No current user found");
    }
  };
  // Open modal for adding or editing
  const openModal = (point = null) => {
    if (point) {
      setAddress(point);
      setPoiSliders(pointsOfInterest[point].importance);
      setName(pointsOfInterest[point].name);
      if (pointsOfInterest[point].maxs) { setMaxs(pointsOfInterest[point].maxs) }
      setCurrentPoint(point);
    } else {
      setAddress('');
      setPoiSliders({ "walking": 0, "car": 0, "transport": 0 });
      setCurrentPoint(null);
    }
    setIsNewPointOpen(true);
  };
  const add_update_place = async (collectionPath, documentId, data) => {
    const docRef = doc(db, collectionPath, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, { "geoloc": geolocation, "createdOn": new Date().toISOString() });
    }

    const path = "users_" + collectionPath;
    const userdocRef = doc(db, path, currentUser.uid);
    const userdocSnap = await getDoc(userdocRef);

    if (collectionPath === "entries" && (!userdocSnap.exists() || !userdocSnap.data().maxs)) {
      const maxDefaults = { "entries": { "Size": data.Size, "Typology": data.Typology, "Price": data.Price, "Coziness": 0 }, "pointsOfInterest": { "walking": 0, "transport": 0, "car": 0 } };
      const bestDefaults = { "entries": { "Size": data.Size, "Typology": data.Typology, "Price": data.Price, "Coziness": 0 }, "pointsOfInterest": { "walking": 0, "transport": 0, "car": 0 } };

      await setDoc(userdocRef, { "stats": bestDefaults[collectionPath] }, { merge: true });
      await setDoc(userdocRef, { "maxs": maxDefaults[collectionPath] }, { merge: true });
    }
    const subCollectionRef = collection(userdocRef, collectionPath); // Sub-collection named as `collectionPath`
    const subDocRef = doc(subCollectionRef, documentId);

    await setDoc(subDocRef, data, { merge: true });

  };
  // Save point of interest
  const savePointOfInterest = () => {
    let newPoint = { name, importance: poiSliders, maxs };
    add_update_place("pointsOfInterest", address, newPoint);

    if (currentPoint)
      newPoint = { name, importance: poiSliders, maxs, geolocation: pointsOfInterest[currentPoint].geolocation };
    else
      newPoint = { name, importance: poiSliders, maxs, geolocation };

    let updatedPointsOfInterest = { ...pointsOfInterest };  // Create a new object
    updatedPointsOfInterest[address] = newPoint;  // Edit existing point
    setPointsOfInterest(updatedPointsOfInterest);  // Update state

    setIsNewPointOpen(false);
    setCurrentPoint(null);
  };

  // Delete point of interest
  const deletePointOfInterest = () => {
    if (currentPoint) {
      let updatedPointsOfInterest = { ...pointsOfInterest };  // Create a new object
      delete updatedPointsOfInterest[currentPoint];  // Remove point
      delUserData("pointsOfInterest", currentPoint);
      setPointsOfInterest(updatedPointsOfInterest);
    }
    setIsNewPointOpen(false);
  };

  // Function to handle slider value change
  const handleSliderChange = (index, value) => {
    const updatedSliders = { ...sliderValues };
    updatedSliders[index] = value;
    setSliderValues(updatedSliders);
    saveUserData({ sliderValues: updatedSliders });
  };

  // Function to handle slider value change
  const functions = getFunctions(); // Get the functions instance
  connectFunctionsEmulator(functions, "localhost", 5001);
  const checkPoint = httpsCallable(functions, "calculateDistance"); // Reference the Cloud Function

  /*  const addNewE ntry = () => {
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
      'Coziness'
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
    const translation = { 'Walking Duration': "walking", 'Driving Duration': "car", "Transport Duration": "transport" };
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
                className={"fas fa-" + icons[translation[header]]}
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
    if (currentUser) {
      updateUserData();
      return Object.entries(entries).map(([entryId, entry], rowIndex) => {
        let score = 0;
        for (const [field, value] of Object.entries({ "Price": entry.info["Price"], "Size": entry.info["Size"], "Typology": entry.info["Typology"], "Coziness": entry.info["Coziness"] })) {
          if (field === "Price") {
            //console.log(field, userMaxs[field]-value, userMaxs[field] - userStats[field])
            score = score + (userMaxs[field] !== userStats[field] ? ((userMaxs[field] - value) * sliderValues[field]) / (userMaxs[field] - userStats[field]) : 0);
          }
          else {
            //console.log(field, value-userMaxs[field], userMaxs[field] - userStats[field])
            score = score + (userMaxs[field] !== userStats[field] ? ((value - userMaxs[field]) * sliderValues[field]) / (userStats[field] - userMaxs[field]) : 0);
          }
          entry["score"] = score;
        }

        // Generate the data cells for the base headers
        const baseDataCells = [
          <td key="link"><a href={entry.info.Link} target="_blank" rel="noopener noreferrer">{entry.info.Link} </a> </td>,
          <td key="address">{entry.info.Address}</td>,
          <td key="description">{entry.info.Description}</td>,
          <td key="price">{entry.info.Price}</td>,
          <td key="typology">{entry.info.Typology}</td>,
          <td key="sqMeters">{entry.info.Size}</td>,
          <td key="coziness">{entry.info.Coziness}</td>,
        ];

        // Generate the distance data cells for each point of interest
        const interestPointDataCells = Object.entries(pointsOfInterest).map(([pointId, point], index) => {
          if (!distances[entryId])
            distances[entryId] = {};
          return [
            <td key={`walking-${index}`} style={{ textAlign: 'center' }}>
              {distances[entryId][pointId] ? `${distances[entryId][pointId]["walking"]} mins` : `- mins`}
            </td>,
            <td key={`driving-${index}`} style={{ textAlign: 'center' }}>
              {distances[entryId][pointId] ? `${distances[entryId][pointId]["car"]} mins` : `- mins`}
            </td>,
            <td key={`transport-${index}`} style={{ textAlign: 'center' }}>
              {distances[entryId][pointId] ? `${distances[entryId][pointId]["transport"]} mins` : `- mins`}
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
            <td>{score}</td>
          </tr>
        );
      });

    }
    else
      return;
  };

  const handleDeleteEntry = () => {
    //if (!currentEntry) return; // Exit the function if currentEntry is null or undefined
    delete entries[currentEntry.info.Address];
    setEntries(entries); // Update the entries array
    setCurrentEntry(null); // Reset current entry after deletion
    setIsNewHouseOpen(false); // Close the modal after deletion
    delUserData("entries", currentEntry.info.Address)
  };

  const openAddEntryModal = () => {
    setCurrentEntry({ Link: '', Description: '', Address: '', Typology: '', Size: '', Price: '', Coziness: '' });
    setIsEditing(false);
    setIsNewHouseOpen(true);
  };

  // Open modal for editing an entry, ensuring `currentEntry` is defined
  const openEditEntryModal = (entry) => {
    setCurrentEntry(entry || { Link: '', Description: '', Address: '', Typology: '', Size: '', Price: '', Coziness: '' });
    setIsEditing(true);
    setIsNewHouseOpen(true);
  };

  // Update function for input fields in the modal
  const handleNewEntryChange = (field, value) => {
    if (field === "Address" || field === "Link" || field === "Description")
      setCurrentEntry(prev => ({ ...prev, [field]: value }));
    else
      if (field !== "Coziness" || (field === "Coziness" && Number(value) >= 0 && Number(value) <= 5))
        setCurrentEntry(prev => ({ ...prev, [field]: Number(value) }));
  };

  const handleAddressChange = (newAddress, newGeolocation) => {
    setAddress(newAddress);  // Save the address
    setGeolocation(newGeolocation);  // Save the geolocation (latitude, longitude)
  };

  const saveOrUpdateEntry = () => {
    if (currentEntry) {
      entries[currentEntry.Address] = { "info": currentEntry, "score": entries[currentEntry.Address] ? entries[currentEntry.Address].score : 0 };
      add_update_place("entries", currentEntry.Address, currentEntry)
    }
    setIsNewHouseOpen(false); // Close the modal
  };

  const colors = ["#db284e", "#db284e", "#db8829", "#c9db29", "#4caf50", "#007bff"]
  const icons = { "walking": "person-walking", "transport": "train", "car": "car" }


  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="top-container">

        {/* Sliders Section */}
        <div className="slider-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Typography variant="h6">Importance</Typography>
            <Typography
              variant="body2"
              style={{ fontWeight: 'bold', fontSize: '0.875rem', color: '#555', marginRight: '5%' }}
            >
              Max
            </Typography>
          </div>

          {[...["Price", "Size", "Typology", "Coziness"]].map((name, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Typography style={{ marginRight: '16px', minWidth: '80px' }}>{name}</Typography>
              <Slider
                style={{ flex: 1 }}
                value={sliderValues[name] !== undefined ? sliderValues[name] : 0}
                onChange={(e, newValue) => handleSliderChange(name, newValue)}
                min={0}
                max={5}
                step={1}
                marks
              />
              <input
                type="number"
                style={{
                  width: '60px',
                  marginLeft: '16px',
                  transform: 'scale(0.8, 0.8)', // Reduces height by 60%
                  transformOrigin: 'center', // Keeps the input centered
                  padding: '4px 2px', // Adjusts padding for better alignment
                }}
                value={sliderValues[name] !== undefined ? sliderValues[name] : 0}
                onChange={(e) => handleSliderChange(name, parseInt(e.target.value) || 0)}
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
                    {Object.entries(pointsOfInterest[point].importance).map(([typ, imp], index) => (
                      <div key={index} className="importance-circle">
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
                              className={"fa fa-" + icons[typ]}
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
                            {pointsOfInterest[point].maxs[index] || 0} mins
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
            <MapComponent pointsOfInterest={pointsOfInterest} />
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
          {['Link', 'Address', 'Description', 'Typology', 'Size', 'Price', 'Coziness'].map(field => (
            <TextField
              key={field}
              label={field}
              value={(currentEntry && currentEntry && currentEntry[field]) || ''} // Show currentEntry values
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
          <AddressSearch
            key={"Address"}
            label={"Address"}
            value={address} // Show currentEntry values
            disableInteraction={currentPoint}
            onChange={handleAddressChange} // Pass both address and geolocation
          />


          {/* Slider and Max Input for Walking Distance */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <Typography>Walking Distance Importance</Typography>
              <Slider
                value={poiSliders["walking"]}
                onChange={(e, v) => setPoiSliders({ ...poiSliders, "walking": v })}
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
                value={poiSliders["transport"]}
                onChange={(e, v) => setPoiSliders({ ...poiSliders, "transport": v })}
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
                value={poiSliders["car"]}
                onChange={(e, v) => setPoiSliders({ ...poiSliders, "car": v })}
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
