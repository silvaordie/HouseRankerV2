import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../AuthContext";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MapComponent from '../MapComponent';
import './ImportOverlay.css';
import ImportGuide from '../../assets/import-guide.png';

const ImportOverlay = ({ onClose, userData, onImportComplete, onCreateManual }) => {
  const { currentUser } = useAuth();
  const [importedEntries, setImportedEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImportedEntries();
  }, []);

  const fetchImportedEntries = async () => {
    if (!currentUser) return;

    try {
      const entriesRef = collection(db, `users_entries/${currentUser.uid}/imported_entries`);
      const snapshot = await getDocs(entriesRef);
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setImportedEntries(entries);
    } catch (error) {
      setError('Error fetching entries: ' + error.message);
    }
  };

  const handleEntrySelect = (entry) => {
    if (selectedEntries.includes(entry.id)) {
      setSelectedEntries(prev => prev.filter(id => id !== entry.id));
    } else {
      setSelectedEntries(prev => [...prev, entry.id]);
      setError(null);
    }
  };

  const capitalizeKeys = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.charAt(0).toUpperCase() + key.slice(1),
        value
      ])
    );
  };

  const consumeTokens = async (amount) => {
    if (!currentUser) return;
    
    const userDocRef = doc(db, "users", currentUser.uid);
    const newTokenAmount = userData.tokens.entries - amount;
    
    await setDoc(userDocRef, {
      tokens: {
        entries: newTokenAmount
      }
    }, { merge: true });
  };

  const handleImport = async () => {
    try {
      // Check if user has enough tokens
      if (selectedEntries.length > userData.tokens.entries) {
        setError(`You only have ${userData.tokens.entries} tokens available`);
        return;
      }

      // Consume tokens first
      await consumeTokens(selectedEntries.length);

      // Then import entries
      for (const entryId of selectedEntries) {
        const entry = importedEntries.find(e => e.id === entryId);
        if (!entry) continue;

        // Create the main entry document with basic info
        const newEntryRef = doc(collection(db, `users_entries/${currentUser.uid}/entries`), entryId);
        await setDoc(newEntryRef, {
          Address: entry.Address,
          Price: entry.Price,
          Size: entry.Size,
          Typology: entry.Typology,
          Link: entry.url,
        });
        
        // Create/Update the entry metadata in the entries collection
        const entryMetadataRef = doc(db, 'entries', entry.Address);
        await setDoc(entryMetadataRef, {
          createdAt: serverTimestamp(),
          geoloc: entry.geolocation || null,
        }, { merge: true });
        
        // Delete from imported entries
        const importedEntryRef = doc(db, `users_entries/${currentUser.uid}/imported_entries`, entryId);
        await deleteDoc(importedEntryRef);
      }

      onImportComplete();
      onClose();
    } catch (error) {
      setError('Error importing entries: ' + error.message);
    }
  };

  const handleRemoveEntries = async () => {
    try {
      for (const entryId of selectedEntries) {
        const importedEntryRef = doc(db, `users_entries/${currentUser.uid}/imported_entries`, entryId);
        await deleteDoc(importedEntryRef);
      }
      // Refresh the list after deletion
      await fetchImportedEntries();
      setSelectedEntries([]);
    } catch (error) {
      setError('Error removing entries: ' + error.message);
    }
  };

  return (
    <div className="import-overlay">
      <div className="import-content">
        <div className="import-left">
          <div className="import-header">
            <Typography variant="h6">Import Listings</Typography>
            <Button className="close-button" onClick={onClose}>×</Button>
          </div>

          {error && <Alert severity="error" className="error-message">{error}</Alert>}
          
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              onClose();
              onCreateManual();
            }}
            className="create-manual-button"
            fullWidth
          >
            Create Manual Entry
          </Button>

          <div className="entries-list">
            {importedEntries.length === 0 ? (
              <div className="empty-list">
                <Typography variant="body1" color="textSecondary">
                  No listings available to import.
                  <br />
                  Use our browser extension to import listings from real estate websites.
                </Typography>
              </div>
            ) : (
              importedEntries.map(entry => (
                <div 
                  key={entry.id}
                  className={`entry-item ${selectedEntries.includes(entry.id) ? 'selected' : ''}`}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => handleEntrySelect(entry)}
                      />
                    }
                    label={
                      <div className="entry-details">
                        <img src={entry.img} alt="" className="entry-icon" />
                        <span className="entry-address">{entry.id}</span>
                      </div>
                    }
                  />
                </div>
              ))
            )}
          </div>
          
          <Button
            variant="outlined"
            color="error"
            disabled={selectedEntries.length === 0}
            onClick={handleRemoveEntries}
            className="remove-button"
            sx={{ mb: 1 }}
          >
            Remove ({selectedEntries.length}) entries
          </Button>

          <Button
            variant="contained"
            color="primary"
            disabled={selectedEntries.length === 0}
            onClick={handleImport}
            className="import-button"
          >
            Import ({selectedEntries.length}) entries
          </Button>
        </div>
        {console.log(importedEntries.filter(e => selectedEntries.includes(e.id)))}
        <div className="import-right">
          {importedEntries.length > 0 && selectedEntries.length > 0 ? (
            <MapComponent 
              sortedEntries={importedEntries
                .filter(e => selectedEntries.includes(e.id))
                .map(entry => [entry.Address, entry])}
              height="100%"
              mode="import"
            />
          ) : (
            <div className="import-guide">
              <Typography variant="h6">How to Import</Typography>
              <img src={ImportGuide} alt="Import Guide" className="guide-image" />
              <Typography variant="body1">
                1. Install our browser extension<br />
                2. Browse real estate websites<br />
                3. Click the extension icon to import listings<br />
                4. Select listings here to add them to your dashboard
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportOverlay;
