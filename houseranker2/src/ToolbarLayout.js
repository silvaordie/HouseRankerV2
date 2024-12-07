import React, { useState } from "react";
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

const ToolbarLayout = ({ user }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleProfileIconClick = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

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
              src={user.profilePic}
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
              <ListItemText primary="Email" secondary={user.email} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Account Created"
                secondary={user.accountCreated}
              />
            </ListItem>
          </List>

          {/* Current Plan Button */}
          <Button
            fullWidth
            sx={{
              mt: 4,
              backgroundColor: "#1976d2",
              color: "white",
              fontWeight: "bold",
            }}
            onClick={() =>
              alert("Explore upgrade options for your subscription.")
            }
          >
            Current Plan: See Upgrade Options
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default ToolbarLayout;
