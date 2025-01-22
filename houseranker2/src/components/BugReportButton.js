import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  Button,
  Modal,
  Box,
  Typography,
  TextField,
  Stack,
} from "@mui/material";

const BugReportButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const firestore = getFirestore();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get the currently authenticated user
    const user = auth.currentUser;

    if (!user) {
      alert("You need to be logged in to report a bug.");
      return;
    }

    try {
      // Add a new document to the "issuesReport" collection
      await addDoc(collection(firestore, "issuesReport"), {
        email: user.email,
        shortDescription,
        detailedDescription,
        date: new Date().toISOString(),
      });

      alert("Bug report submitted successfully!");
      // Clear the form and close the modal
      setShortDescription("");
      setDetailedDescription("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error reporting bug:", error);
      alert("Failed to submit bug report. Please try again.");
    }
  };

  return (
    <>
      {/* Floating Bug Report Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsModalOpen(true)}
        sx={{
          position: "fixed",
          bottom: 16, // Distance from the bottom of the page
          left: 16,   // Distance from the left of the page
          zIndex: 1000, // Ensures the button appears above other content
          borderRadius: "10%",
          padding: 1,
          display: "flex",
          fontSize:"10px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Report an issue
      </Button>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="bug-report-modal-title"
        aria-describedby="bug-report-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography
            id="bug-report-modal-title"
            variant="h6"
            component="h2"
            mb={2}
          >
            Bug Report
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Short Description"
                variant="outlined"
                fullWidth
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                required
              />
              <TextField
                label="How to Reproduce"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                required
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Submit
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default BugReportButton;
