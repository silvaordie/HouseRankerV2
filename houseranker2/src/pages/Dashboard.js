// Dashboard.js
import React, { useEffect, useState, useRef } from 'react';
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
import { db } from "../firebase"; // Import the Firestore instance
import { updateDoc, doc, getDoc, setDoc, collection, getDocs, deleteDoc, onSnapshot } from "firebase/firestore"; // Import Firestore functions
import { useAuth } from "../AuthContext"; // Import your custom auth hook/context provider
import AddressSearch from "../components/AddressSearch";
import MapComponent from '../components/MapComponent';  // Import MapComponent
import ToolbarLayout from '../components/ToolbarLayout';
import { useNavigate } from "react-router-dom";
import Tooltip from '@mui/material/Tooltip';
import LinkIcon from '@mui/icons-material/Link';
import { functions, httpsCallable } from '../firebase';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ButtonSelector from '../components/ButtonSelector';
import { performance } from '../firebase';
import { trace } from "firebase/performance";
import { useCaptchaVerification } from '../components/verifyCaptcha';
import BugReportButton from '../components/BugReportButton';
import ImportOverlay from '../components/ImportOverlay/ImportOverlay';
import WebPageOverlay from '../components/WebPageOverlay/WebPageOverlay';

const Dashboard = () => {
  // const useStateWithCache = (key, defaultValue) => {

  //   const [value, setValue] = useState(() => {

  //     const cachedValue = localStorage.getItem(key);
  //     return cachedValue !== "undefined" ? JSON.parse(cachedValue) : defaultValue;
  //   });

  //   const setCachedValue = (newValue) => {
  //     setValue(newValue); // Update React state

  //     localStorage.setItem(key, JSON.stringify(newValue)); // Update cache
  //   };

  //   return [value, setCachedValue];
  // };

  const navigate = useNavigate();

  //const navigate = useNavigate();
  const { currentUser } = useAuth(); // Access currentUser directly from context
  const [userStats, setUserStats] = useState("userStats", {});
  const [userMaxs, setUserMaxs] = useState("userMaxs", {});
  const [sliderValues, setSliderValues] = useState("sliderValues", { "Size": 0, "Typology": 0, "Price": 0, "Coziness": 0 }); // Initial sliders
  const [entries, setEntries] = useState({});
  const [scores, setScores] = useState({});
  const [isNewHouseOpen, setIsNewHouseOpen] = useState(false); // Modal state for adding new entry

  const [pointsOfInterest, setPointsOfInterest] = useState({});
  const [isNewPointOpen, setIsNewPointOpen] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(null); // To track if editing an existing point

  const [userData, setUserData] = useState({});
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [geolocation, setGeolocation] = useState({ lat: null, lon: null });
  const [poiSliders, setPoiSliders] = useState({ "walking": 0, "car": 0, "transport": 0 });
  const [maxs, setMaxs] = useState({});
  const [currentEntry, setCurrentEntry] = useState(null); // For both adding and editing
  const [isEditing, setIsEditing] = useState(false);
  const [distances, setDistances] = useState({});
  const [outOfTokens, setOutOfTokens] = useState(false);
  const [sortConfig, setSortConfig] = React.useState({ key: "Score", direction: 'dsc' });
  const [isDataLoaded, setIsDataLoaded] = useState(false);  // New state to track the first load
  const captchaVerified = useCaptchaVerification();
  const [showImportOverlay, setShowImportOverlay] = useState(false);
  const [editModalTimer, setEditModalTimer] = useState(null);
  const [isWebPageOpen, setIsWebPageOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  useEffect(() => {
    if (!captchaVerified) {
      // If the CAPTCHA is not verified, you might want to display a loading indicator
      // or something that tells the user that CAPTCHA is being validated.
      console.log('Verifying CAPTCHA...');
    }
  }, [captchaVerified]);

  /*const updateUserData = async () => {
    if (currentUser && (!sliderValues || !userMaxs || !userStats)) { // Ensure currentUser is defined
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
  };*/

  useEffect(() => {
    if (!entries || Object.keys(entries).length === 0 || !captchaVerified) return;
    const calculateScores = () => {
      const updatedScores = { ...scores };
      Object.entries(entries).forEach(([entryId, entry]) => {
        let score = 0;
        // Base score calculation logic
        for (const [field, value] of Object.entries({
          "Price": entry.info.Price ? entry.info.Price : 0,
          "Size": entry.info.Size ?   entry.info.Size : 0,
          "Typology": entry.info.Typology ?   entry.info.Typology : 0,
          "Coziness": entry.info.Coziness ?  entry.info.Coziness : 0,
        })) {
          if (field === "Price") {
            score += userMaxs[field] !== userStats[field]
              ? ((userMaxs[field] - value) * 5 * sliderValues[field]) /
              (userMaxs[field] - userStats[field])
              : 0;
          } else {
            score += userMaxs[field] !== userStats[field]
              ? ((value - userMaxs[field]) * 5 * sliderValues[field]) /
              (userStats[field] - userMaxs[field])
              : 0;
          }
        }

        Object.entries(pointsOfInterest).forEach(([pointId, point]) => {
          for (const [field, value] of Object.entries(point.maxs)) {
            score += (((distances[entryId] && distances[entryId][pointId] && distances[entryId][pointId][field] < value) ? ((value - distances[entryId][pointId][field]) * 5) / value : 0) * point["importance"][field])
          }
        });

        updatedScores[entryId] = score;
      });

      setScores(updatedScores); // Update state with calculated scores
    };
    calculateScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, sliderValues, userMaxs, userStats, pointsOfInterest, distances, captchaVerified]);


  const processedPairs = useRef(new Set());


  const getDistanceBetween = async (entryId, poiId) => {
    if (entryId) {
      const checkPoint = httpsCallable(functions, "calculateDistance");
      const result = await checkPoint({ entryId, poiId });
      // Update distances state with fetched result
      setDistances(prevDistances => ({
        ...prevDistances,
        [entryId]: {
          ...prevDistances[entryId],
          [poiId]: result.data,
        },
      }));

      // Save the result to Firestore
      const docRef = doc(db, "distances", entryId);
      await setDoc(docRef, { [poiId]: result.data }, { merge: true });


      // Mark this entry-POI pair as processed
      processedPairs.current.add(`${entryId}-${poiId}`);
    }
  };
  const loadDistances = async () => {
    if (entries && pointsOfInterest) {
      for (const [entryId, entry] of Object.entries(entries)) {

        const docRef = doc(db, "distances", entryId);

        const docSnapshot = await getDoc(docRef);
        if (!docSnapshot.exists())
          await setDoc(docRef, {}, { merge: true });

        const docData = docSnapshot.data();
        Object.entries(pointsOfInterest).forEach(([poiId, poi]) => {
          if (docData && docData[poiId]) {
            setDistances(prevDistances => ({
              ...prevDistances,
              [entryId]: {
                ...prevDistances[entryId],
                [poiId]: docData[poiId],
              },
            }));
          }
          else {
            getDistanceBetween(entryId, poiId)
          }
        });
      };
    }
  }
  const fetchData = async () => {
    if (currentUser && captchaVerified) {
      const fetchDataTrace = trace(performance, "FetchDataTrace");
      try {
        console.log("Fetching data")
        fetchDataTrace.start();

        // Batch all the data fetching first
        const userRef = doc(db, "users", currentUser.uid);
        const udoc = await getDoc(userRef);
        const userData = udoc.data();

        const userDocRef = doc(db, "users_entries", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const data = userDoc.data() || {};

        const entriesJson = {};
        const pointsOfInterestJson = {};

        // Fetch all collections data first
        for (const typ of ["entries", "pointsOfInterest"]) {
          const collectionRef = collection(db, `users_${typ}/${currentUser.uid}/${typ}`);
          const querySnapshot = await getDocs(collectionRef);
          const mainCollectionRef = collection(db, typ);

          // Process all documents in parallel using Promise.all
          await Promise.all(querySnapshot.docs.map(async (userDoc) => {
            const docId = userDoc.id;
            const userDocData = userDoc.data();
            const mainDocRef = doc(mainCollectionRef, docId);
            let mainDocData;

            try {
              const mainDocSnapshot = await getDoc(mainDocRef);
              
              if (!mainDocSnapshot.exists()) {
                mainDocData = { geoloc: { lat: 0, lon: 0 } };
                // Create the document if it doesn't exist
                await setDoc(mainDocRef, {
                  info: userDocData,
                  ...mainDocData
                });
              } else {
                mainDocData = mainDocSnapshot.data();
              }

              // Store in the appropriate object
              if (typ === "entries") {
                entriesJson[docId] = {
                  info: userDocData,
                  geolocation: mainDocData.geoloc,
                };
              } else {
                pointsOfInterestJson[docId] = {
                  ...userDocData,
                  geolocation: mainDocData.geoloc,
                };
              }
              console.log(entriesJson)
            } catch (error) {
              console.error(`Error processing document ${docId}:`, error);
            }
          }));
        }

        // Batch all state updates together
        const stateUpdates = () => {
          setUserData(userData);
          setSliderValues(data.sliderValues || { "Size": 0, "Typology": 0, "Price": 0, "Coziness": 0 });
          setUserMaxs(data.maxs || {});
          setUserStats(data.stats || {});
          setEntries(entriesJson);
          setPointsOfInterest(pointsOfInterestJson);
        };

        // Apply all state updates at once
        stateUpdates();

      } catch (error) {
        console.error("Error fetching user data:", error.message);
      } finally {
        fetchDataTrace.stop();
        // Only load distances after all state updates are complete
        if (Object.keys(entries).length > 0 && Object.keys(pointsOfInterest).length > 0) {
          await loadDistances();
        }
      }
    }
  }
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaVerified, currentUser]);
  useEffect(() => {
    if (!isDataLoaded && 
        Object.keys(entries).length > 0 && 
        Object.keys(pointsOfInterest).length > 0 && 
        captchaVerified && 
        currentUser) {
      const loadData = async () => {
        await loadDistances();
        setIsDataLoaded(true);
      };
      loadData();
    }
  }, [entries, pointsOfInterest, isDataLoaded, captchaVerified, currentUser]);

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
  const openModal = async (point = null) => {
    if (userData) {
      if (point) {
        setAddress(point);
        setPoiSliders(pointsOfInterest[point].importance);
        setName(pointsOfInterest[point].name);
        setMaxs(pointsOfInterest[point].maxs || { walking: 0, transport: 0, car: 0 });
        setCurrentPoint(point);
        setIsNewPointOpen(true);
      } else {
        if (userData && userData.tokens.pointsOfInterest > 0) {
          setAddress('');
          setPoiSliders({ "walking": 0, "car": 0, "transport": 0 });
          setMaxs({ walking: 0, transport: 0, car: 0 });
          setCurrentPoint(null);
          setIsNewPointOpen(true);
        }
        else {
          setOutOfTokens(true);
        }
      }
    }
  };

  const consumeToken = async (collectionPath) => {
    const userDocRef = doc(db, "users", currentUser.uid); // Reference to the user's document
    const userDoc = await getDoc(userDocRef); // Fetch the document
    const data = userDoc.data();

    const newTokens = data.tokens[collectionPath] - 1;

    setUserData((prevUserData) => ({
      ...prevUserData,
      tokens: { ...prevUserData.tokens, [collectionPath]: newTokens }, // New tokens object
    }));

    await setDoc(userDocRef, {
      tokens: {
        [collectionPath]: newTokens,
      }
    }, { merge: true }
    );
  }

  const add_update_place = async (collectionPath, documentId, data) => {
    const docRef = doc(db, collectionPath, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, { "geoloc": geolocation, "createdOn": new Date().toISOString() });
      if (collectionPath === "entries") {
        Object.keys(pointsOfInterest).forEach(poiId => {
          getDistanceBetween(documentId, poiId);
        });
      }
      else {
        Object.keys(entries).forEach(entryId => {
          getDistanceBetween(entryId, documentId);
        });
      }
    }
    else {
      if (collectionPath === "entries") {
        const docRef = doc(db, "distances", documentId);
        const docSnapshot = await getDoc(docRef);

        const docData = docSnapshot.data();
        Object.keys(pointsOfInterest).forEach(poiId => {
          if (docData && docData[poiId])
            setDistances(prevDistances => ({
              ...prevDistances,
              [documentId]: {
                ...prevDistances[documentId],
                [poiId]: docData[poiId],
              },
            }));
          else
            getDistanceBetween(documentId, poiId);
        });
      }
      else {
        Object.keys(entries).forEach(entryId => {
          getDistanceBetween(entryId, documentId);
        });
      }
    }

    const path = "users_" + collectionPath;
    const userdocRef = doc(db, path, currentUser.uid);
    let userdocSnap = await getDoc(userdocRef);
    const subCollectionRef = collection(userdocRef, collectionPath); // Sub-collection named as `collectionPath`
    const subDocRef = doc(subCollectionRef, documentId);
    const subDdocSnap = await getDoc(subDocRef);

    if (!subDdocSnap.exists())
      consumeToken(collectionPath)

    await setDoc(subDocRef, data, { merge: true });
    await setDoc(userdocRef, { processed: false }, { merge: true });

    if (collectionPath === "entries" && (!userdocSnap.exists() || !userdocSnap.data().maxs)) {
      const maxDefaults = { "entries": { "Size": data.Size, "Typology": data.Typology, "Price": data.Price, "Coziness": 0 }, "pointsOfInterest": { "walking": 0, "transport": 0, "car": 0 } };
      const bestDefaults = { "entries": { "Size": data.Size, "Typology": data.Typology, "Price": data.Price, "Coziness": 0 }, "pointsOfInterest": { "walking": 0, "transport": 0, "car": 0 } };

      await setDoc(userdocRef, { "stats": bestDefaults[collectionPath] }, { merge: true });
      await setDoc(userdocRef, { "maxs": maxDefaults[collectionPath] }, { merge: true });
      setUserMaxs(maxDefaults)
      setUserStats(bestDefaults)
    }
    else {
      // Wait for real-time updates using onSnapshot
      const unsubscribe = onSnapshot(userdocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log(userData.processed)

          // Check if the necessary fields are updated
          if (userData.processed) {
            setUserMaxs(userData.maxs || {});
            setUserStats(userData.stats || {});

            // Unsubscribe once the condition is satisfied
            unsubscribe();
          }
        } else {
          console.error("Document does not exist!");
        }
      });
    }
  };
  // Save point of interest
  const savePointOfInterest = () => {
    if (address) {
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
      setName(null)
      setAddress(null)
      setCurrentPoint(null);
    }
    else
      alert("Cannot create an Interest point without an Address !")
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
      { key: 'Link', label: 'Link', sortable: false },
      { key: 'Address', label: 'Address', sortable: false },
      { key: 'Description', label: 'Description', sortable: false },
      { key: 'Price', label: 'Price', sortable: true },
      { key: 'Typology', label: 'Typology', sortable: true },
      { key: 'Size', label: 'Size', sortable: true },
      { key: 'Coziness', label: 'Coziness', sortable: true },
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
          {baseHeaders.map((header) => (
            <th
              key={header.key}
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={header.sortable ? () => handleSort(header.key) : null} // Only attach onClick for sortable columns
            >
              {header.key}
              {header.sortable ? (sortConfig.key === header.key ? (
                <i className={`fas fa-chevron-${sortConfig.direction === 'asc' ? 'up' : 'down'}`} style={{ marginLeft: '5px' }} />
              ) : <i className="fas fa-sort" style={{ marginLeft: '5px', color: 'lightgrey' }}></i>) : null}
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
          <th
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={() => handleSort('Score')}
          >
            Score
            {sortConfig.key === 'Score' ? (
              <i className={`fas fa-chevron-${sortConfig.direction === 'asc' ? 'up' : 'down'}`} style={{ marginLeft: '5px' }} />
            ) : <i className="fas fa-sort" style={{ marginLeft: '5px', color: 'lightgrey' }}></i>}
          </th>
        </tr>
      </React.Fragment>
    );
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedEntries = React.useMemo(() => {
    if (!sortConfig.key) return Object.entries(entries);
    return [...Object.entries(entries)].sort((a, b) => {
      const [trash1, aEntry] = a;
      const [trash2, bEntry] = b;

      let aValue, bValue;

      // Handle "Score" key separately since it's stored directly in the entry
      if (sortConfig.key === 'Score') {
        aValue = scores[aEntry.info.Address] || 0;
        bValue = scores[bEntry.info.Address] || 0;
      } else {
        // Default to the `info` object for other keys
        aValue = aEntry.info[sortConfig.key];
        bValue = bEntry.info[sortConfig.key];
      }

      // Ensure proper handling of null/undefined values
      aValue = aValue ?? '';
      bValue = bValue ?? '';

      // Ascending order comparison
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;

      return 0; // Values are equal
    });
  }, [entries, sortConfig, scores]);

  const tableRows = React.useMemo(() => {
    if (!currentUser) return null;

    return sortedEntries.map(([entryId, entry], rowIndex) => {
      const handleLinkClick = (e, url) => {
        e.stopPropagation(); // Prevent row click event
        setCurrentUrl(url);
        setIsWebPageOpen(true);
      };

      const baseDataCells = [
        <td key="link">
          <Tooltip title={entry.info.Link} arrow>
            <span>
              {entry.info.Link ?
                <span onClick={(e) => handleLinkClick(e, entry.info.Link)}>
                  <LinkIcon style={{ fontSize: '18px', cursor: 'pointer' }} />
                </span>
                :
                <Typography>-</Typography>
              }
            </span>
          </Tooltip>
        </td>,
        <td key="address">{entry.info.Address ? entry.info.Address : "-"}</td>,
        <td key="description">{entry.info.Description ? entry.info.Description : "-"}</td>,
        <td key="price">{entry.info.Price ? entry.info.Price : "-"}</td>,
        <td key="typology">{entry.info.Typology ? entry.info.Typology : "-"}</td>,
        <td key="sqMeters">{entry.info.Size ? entry.info.Size : "-"}</td>,
        <td key="coziness">{entry.info.Coziness ? entry.info.Coziness : "0"}</td>,
      ];

      const interestPointDataCells = Object.entries(pointsOfInterest).map(([pointId, point], index) => [
        <td key={`walking-${index}`} style={{ textAlign: 'center' }}>
          {distances[entryId]?.[pointId]?.walking ? `${distances[entryId][pointId].walking} mins` : '- mins'}
        </td>,
        <td key={`driving-${index}`} style={{ textAlign: 'center' }}>
          {distances[entryId]?.[pointId]?.car ? `${distances[entryId][pointId].car} mins` : '- mins'}
        </td>,
        <td key={`transport-${index}`} style={{ textAlign: 'center' }}>
          {distances[entryId]?.[pointId]?.transport ? `${distances[entryId][pointId].transport} mins` : '- mins'}
        </td>
      ]);

      return (
        <tr
          key={rowIndex}
          onClick={() => openEditEntryModal(entry)}
          style={{ cursor: 'pointer', backgroundColor: rowIndex % 2 === 0 ? '#f9f9f9' : '#fff' }}
        >
          {baseDataCells}
          {interestPointDataCells}
          <td>{Number(scores[entryId] ?? 0).toFixed(0)}</td>
        </tr>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, sortedEntries, pointsOfInterest, distances]);

  const renderTableRows = () => {
    if (currentUser) {
      //updateUserData();

      return (
        tableRows
      );
    }
    else
      return;
  };

  const handleDeleteEntry = () => {
    if (!currentEntry) return; // Exit the function if currentEntry is null or undefined

    const updatedEntries = { ...entries }; // Create a shallow copy of entries
    delete updatedEntries[currentEntry.info.Address]; // Remove the entry using the address

    setEntries(updatedEntries); // Update the entries state with the new object
    setCurrentEntry(null); // Reset the current entry after deletion
    setIsNewHouseOpen(false); // Close the modal after deletion

    delUserData("entries", currentEntry.info.Address); // Remove the user data from the database or backend
  };

  const openAddEntryModal = async () => {
    if (userData && userData.tokens.entries > 0) {
      setShowImportOverlay(true);
    }
    else {
      setOutOfTokens(true);
    }
  };

  // Open modal for editing an entry, ensuring `currentEntry` is defined
  const openEditEntryModal = (entry) => {
    if (editModalTimer) {
      clearTimeout(editModalTimer);
    }
    
    // Deep copy the entry
    const entryToEdit = {
      info: JSON.parse(JSON.stringify(entry.info)),
      geolocation: entry.geolocation
    };
    
    setCurrentEntry(entryToEdit);
    if (entryToEdit.info.Address) {
      setAddress(entryToEdit.info.Address);
    }
    
    setIsEditing(true);
    // Delay opening the modal slightly to prevent state conflicts
    const timer = setTimeout(() => {
      setIsNewHouseOpen(true);
    }, 0);
    setEditModalTimer(timer);
  };

  // Update function for input fields in the modal
  const handleNewEntryChange = (field, value) => {
    if (currentEntry?.info?.[field] === value) return;

    setCurrentEntry(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        info: {
          ...prev.info,
          [field]: field === "Coziness" 
            ? (Number(value) >= 0 && Number(value) <= 5 ? Number(value) : prev.info[field])
            : field === "Price" || field === "Size" || field === "Typology"
              ? Number(value) || value
              : value
        }
      };
    });
  };

  const handleAddressChange = (newAddress, newGeolocation) => {
    // Only update if values actually changed
    if (address !== newAddress) {
      setAddress(newAddress);
    }
    if (geolocation?.lat !== newGeolocation?.lat || geolocation?.lon !== newGeolocation?.lon) {
      setGeolocation(newGeolocation);
    }
  };

  const saveOrUpdateEntry = () => {
    if (currentEntry) {
      const updatedEntry = currentEntry;
      if (address) {
        updatedEntry.info.Address = address;
        console.log(updatedEntry)
        setEntries((prevEntries) => ({
          ...prevEntries,
          [address]: {
            ...prevEntries[address], // Spread existing properties of the current entry
            info: updatedEntry.info, // Update the `info` section
            geolocation: updatedEntry.geolocation ? updatedEntry.geolocation : geolocation
          },
        }));

        add_update_place("entries", updatedEntry.info.Address, updatedEntry.info)
        setIsNewHouseOpen(false); // Close the modal
      }
      else
        alert("Cannot save an entry without a Address !")

    }

  };

  const handleCreateManualEntry = () => {
    setCurrentEntry({ "info": { Link: '', Description: '', Address: '', Typology: '', Size: '', Price: '', Coziness: '' } });
    setAddress('');
    setIsEditing(false);
    setIsNewHouseOpen(true);
  };
  console.log(sortedEntries)

  const colors = ["#db284e", "#db284e", "#db8829", "#c9db29", "#4caf50", "#007bff"]
  const icons = { "walking": "person-walking", "transport": "train", "car": "car" }
  if (!captchaVerified) {
    // You can show a loading screen or a message here while CAPTCHA is being verified
    return <div>Verifying CAPTCHA...</div>;
  }
  return (
    <div className="dashboard-container">
      <ToolbarLayout userData={userData} db={db} />
      {/* Header Section */}
      <div className="top-container">

        {/* Sliders Section */}
        <div className="slider-container">
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
          >
            <Typography variant="h6">Importance</Typography>

            {/* Tooltip Icon for Importance Section */}
            <Tooltip title="How important are these factors to you? Adujst the sliders accordingly from left to right" arrow>
              <span style={{ cursor: 'pointer' }}>
                <HelpOutlineIcon style={{ color: '#fff', backgroundColor: '#808080', borderRadius: '50%', padding: '0px', fontSize: '20px' }} />
              </span>
            </Tooltip>
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
            </div>
          ))}
        </div>



        <div className="list-map-container">
          {/* List Section */}
          <div className="dynamic-list">
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
            >
              <Typography variant="h6">Points of Interest</Typography>

              {/* Tooltip Icon for poi Section */}
              <Tooltip title="Here are your points of interest, how important is to reach them by foot, car or train and how far they should from a property" arrow>
                <span style={{ cursor: 'pointer' }}>
                  <HelpOutlineIcon style={{ color: '#fff', backgroundColor: '#808080', borderRadius: '50%', padding: '0px', fontSize: '20px' }} />
                </span>
              </Tooltip>
            </div>
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
                            {pointsOfInterest[point].maxs[typ] || 0} mins
                          </text>
                        </svg>
                      </div>
                    ))}
                  </div>


                  <button className="button" onClick={() => openModal(point)}>Edit Interest Point</button>
                </div>
              )))}
            <button onClick={() => openModal()} className="add-point-button">
              Add Point of Interest
            </button>

          </div>
          {/* Map Section */}
          <div className="map-container">
            <Typography variant="h6" style={{ textAlign: 'center' }}></Typography>
            <MapComponent pointsOfInterest={pointsOfInterest} sortedEntries={sortedEntries} />
          </div>
        </div>


      </div>
      {/* Main Section - Dynamic Table */}
      <div className="bottom-list-container">
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
        >
          <Typography variant="h6">Main Table</Typography>

          {/* Tooltip Icon for Importance Section */}
          <Tooltip title="Here is the list of all the properties you are interested in and their details. You can modify them by clicking in the tabl eentry or add a new one in the button below" arrow>
            <span style={{ cursor: 'pointer' }}>
              <HelpOutlineIcon style={{ color: '#fff', backgroundColor: '#808080', borderRadius: '50%', padding: '0px', fontSize: '20px' }} />
            </span>
          </Tooltip>
        </div>
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
      {/* Modal ran out of tokens*/}
      <Modal open={outOfTokens} onClose={() => setOutOfTokens(false)}>
        <Box className="modal-box" style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">{'No more tokens'}</Typography>
          <Box marginTop={2}>
            <Button onClick={() => navigate("/select-plan")}
            >
              {'get more tokens'}
            </Button>
          </Box>
        </Box>
      </Modal>
      {/* Modal for Adding New Entry */}
      <Modal open={isNewHouseOpen} onClose={() => setIsNewHouseOpen(false)}>
        <Box className="modal-box" style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">{isEditing ? 'Edit Entry' : 'Add New Entry'}</Typography>
          {['Link', 'Address*', 'Description', 'Typology', 'Size', 'Price',].map(field => (
            field === "Address*" ?

              <AddressSearch
                key={"Address"}
                label={"Address"}
                value={currentEntry && currentEntry.info && currentEntry.info["Address"]} // Show currentEntry values
                disableInteraction={isEditing}
                onChange={handleAddressChange} // Pass both address and geolocation
              />
              :
              <TextField
                key={field}
                label={field}
                value={(currentEntry && currentEntry.info && currentEntry.info[field]) || ''} // Show currentEntry values
                disabled={isEditing && (field === "Address")}
                onChange={(e) => handleNewEntryChange(field, e.target.value)}
                fullWidth
                margin="normal"
              />
          ))}
          <ButtonSelector
            value={currentEntry && currentEntry.info && currentEntry.info.Coziness}
            onChange={(e) => handleNewEntryChange("Coziness", e.target.value)}
          />
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
              <Typography>Max <Tooltip title="What's the maximum commute duration you would consider for each transport type, in minutes?" arrow>
                <span style={{ cursor: 'pointer' }}>
                  <HelpOutlineIcon style={{ color: '#fff', backgroundColor: '#808080', borderRadius: '50%', padding: '0px', fontSize: '14px' }} />
                </span>
              </Tooltip></Typography>
              <input
                type="number"
                style={{ width: '60px' }}
                value={maxs.walking || 0}
                placeholder="mins"
                onChange={(e) => setMaxs(prevMaxs => ({
                  ...prevMaxs,
                  walking: parseInt(e.target.value) || 0,
                }))}
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
              value={maxs.transport || 0}
              placeholder="mins"
              onChange={(e) => setMaxs(prevMaxs => ({
                ...prevMaxs,
                transport: parseInt(e.target.value) || 0,
              }))} />
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
              value={maxs.car || 0}
              placeholder="mins"
              onChange={(e) => setMaxs(prevMaxs => ({
                ...prevMaxs,
                car: parseInt(e.target.value) || 0,
              }))} />
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

      <BugReportButton></BugReportButton>
      {showImportOverlay && (
        <ImportOverlay
          onClose={() => setShowImportOverlay(false)}
          userData={userData}
          onImportComplete={fetchData}
          onCreateManual={handleCreateManualEntry}
        />
      )}
      <WebPageOverlay
        open={isWebPageOpen}
        onClose={() => setIsWebPageOpen(false)}
        url={currentUrl}
      />
    </div>
  );
};

export default Dashboard;
