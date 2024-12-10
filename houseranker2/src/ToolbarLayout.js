import React, { useEffect,useCallback,useState } from "react";
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
import {  doc, getDoc } from "firebase/firestore"; // Import Firestore functions


const ToolbarLayout = ({ user, db }) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userData, setUserData] = useState({});
  const handleProfileIconClick = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);


  const fetchData = useCallback(async () => {
    if(user && drawerOpen)
    {
      const userDocRef = doc(db, "users", user); // Reference to the user's document
      const userDoc = await getDoc(userDocRef); // Fetch the document
      const data = userDoc.data();

      setUserData(data);
    }
  });
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          </Typography>

          {/* User Icon */}
          <IconButton onClick={handleProfileIconClick} edge="end">
            <img
              src={""}
              alt="Profile"
              style={{ width: 20, height: 20, borderRadius: "50%" }}
            />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content with Margin-Top to Offset Toolbar */}
      <Box sx={{ mt: 1, padding: 1 }}>

      </Box>
      {/* Vertical Sidebar */}
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
                secondary={userData.createdAt}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Tokens :"
                secondary={"Point of Interest: "+ userData && userData.tokens ?  userData.tokens["pointsOfInterest"] : 0 }
              />
              <ListItemText
                primary="."
                secondary={"Point of Interest: "+ userData && userData.tokens ? userData.tokens["entries"] : 0}
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
      </Drawer>
    </Box>
  );
};

export default ToolbarLayout;
