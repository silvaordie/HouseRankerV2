import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { signOut } from "firebase/auth"; // Firebase auth for sign out
import { auth } from "../firebase"; // Adjust with your Firebase config file


const ToolbarLayout = ({ userData, db }) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleProfileIconClick = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);
  // Log out function
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out user from Firebase
      navigate("/"); // Navigate to login page after sign-out
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  /*   // Define the fetchData function
    const fetchData = useCallback(async () => {
      if (user && !userData.email) {
        try {
          const userDocRef = doc(db, "users", user); // Reference to the user's document
          const userDoc = await getDoc(userDocRef); // Fetch the document
          const data = userDoc.data();
  
          if (data) {
            setUserData(data);
            localStorage.setItem("userData", JSON.stringify(data));
          } else {
            console.error("No user data found.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    }, [user, db, setUserData, userData]); // Dependencies
  
    // Trigger fetchData when the component is loaded
    useEffect(() => {
      fetchData();
    }, [fetchData]); // Dependency to call fetchData when its memoized value changes
   */
  const formattedDate = userData ? new Date(userData.createdAt).toLocaleString('en-UK', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }) : new Date(0);
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Toolbar */}
      <AppBar
        position="fixed"
        sx={{ backgroundColor: "#000", height: 40, elevation: 0 }}  // Black toolbar
        elevation={0}  // Removes shadow
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {/* Add your main toolbar title or content here if needed */}
          </Typography>

          {/* Email and Clickable Circle */}
          {userData && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* User Email */}
              <Typography variant="body2" sx={{ marginRight: 1 }}>
                {userData.email}
              </Typography>

              {/* Clickable Circle */}
              <IconButton
                onClick={handleProfileIconClick}
                sx={{
                  width: 32,
                  height: 32,
                  padding: 0, // Remove extra padding from IconButton
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: "blue",
                    color: "white",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {userData.email ? userData.email[0] : ""}
                </Box>
              </IconButton>
            </Box>
          )}

        </Toolbar>
      </AppBar>

      {/* Main Content with Margin-Top to Offset Toolbar */}
      <Box sx={{ mt: 1, padding: 1 }}>

      </Box>
      {/* Vertical Sidebar */}
      {userData && (
        <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
          <Box sx={{ width: 300, padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Account Info
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* User Info */}
            <List>
              <ListItem>
                <ListItemText primary="Email" secondary={userData.email} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Account Created"
                  secondary={formattedDate}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Tokens :"
                  secondary={"Point of Interest: " + userData && userData.tokens ? userData.tokens["pointsOfInterest"] : 0}
                />
                <ListItemText
                  primary="."
                  secondary={"Point of Interest: " + userData && userData.tokens ? userData.tokens["entries"] : 0}
                />
              </ListItem>
            </List>

            {/* Current Plan Button */}
            <Button
              fullWidth
              sx={{
                mt: 4,
                backgroundColor: "#000000",
                color: "white",
                fontWeight: "bold",
              }}
              onClick={() =>
                navigate("/select-plan")
              }
            >
              Get more tokens
            </Button>
          </Box>
          {/* Log Out Button at the Bottom */}
      {userData && (
        <Box sx={{ position: "absolute", bottom: 16, right: 16, left: 16 }}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            sx={{
              height: 40,
              borderRadius: 0,
              backgroundColor: "#808080", // Grey color
              color: "white",
              textTransform: "none",
            }}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </Box>
      )}
        </Drawer>)}
    </Box>
  );
};

export default ToolbarLayout;
