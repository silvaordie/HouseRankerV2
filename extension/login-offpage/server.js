import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 6000;

// Enable CORS for the extension
app.use(cors({
    origin: [
        'chrome-extension://*',
        'http://localhost:6000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Login page server running at http://localhost:${PORT}`);
    console.log(`Make sure Firebase emulators are running on port 9099`);
});
