import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LinkMetadataPopup = ({ url }) => {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (!url) return;

    const fetchMetadata = async () => {
      try {
        const response = await axios.get('https://api.linkpreview.net', {
          params: {
            key: 'YOUR_API_KEY', // Replace with your API key
            q: url,
          },
        });
        setMetadata(response.data);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    fetchMetadata();
  }, [url]);

  if (!metadata) return null;

  return (
    <div className="link-metadata-popup">
      <div>
        <strong>{metadata.title}</strong>
      </div>
      <div>{metadata.description}</div>
      {metadata.image && <img src={metadata.image} alt="Link preview" />}
    </div>
  );
};

