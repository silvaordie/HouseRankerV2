import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const WebPageOverlay = ({ open, onClose, url }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="webpage-overlay"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box sx={{
        width: '90vw',
        height: '90vh',
        bgcolor: 'background.paper',
        position: 'relative',
      }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500',
            zIndex: 1
          }}
        >
          <CloseIcon />
        </IconButton>
        <iframe
          src={url}
          title="Embedded Webpage"
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
      </Box>
    </Modal>
  );
};

export default WebPageOverlay;
