const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoUrlAtlas = "mongodb+srv://bgrs:GaNhUz0gLwQsznBt@signup.x1mdm.mongodb.net/"; // Directly embedded MongoDB URI
const dbName = 'signup';
let mongoDb;

// Connection options
const options = {
    serverSelectionTimeoutMS: 5000,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
};

// Function to connect to MongoDB
async function connectToDatabase() {
    try {
        const client = await MongoClient.connect(mongoUrlAtlas, options);
        mongoDb = client.db(dbName);
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }
}

// Connect to MongoDB Atlas
connectToDatabase();

// MongoDB signup endpoint
app.post('/signup', async (req, res) => {
    const { name, email, username, password } = req.body;

    try {
        if (!mongoDb) {
            return res.status(500).json({ message: 'Database not connected' });
        }
        
        const existingUser = await mongoDb.collection('login').findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email or Username already registered' });
        }
        await mongoDb.collection('login').insertOne({ name, email, username, password });
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error during signup:', err);
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// MongoDB login endpoint
app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    try {
        if (!mongoDb) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        const user = await mongoDb.collection('login').findOne({
            $or: [
                { email: identifier }, 
                { username: identifier }
            ]
        });
        
        if (!user || password !== user.password) {
            return res.status(401).json({ message: 'Invalid email/username or password' });
        }

        return res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// Start the Express server
app.listen(8081, () => {
    console.log('Listening on port 8081...');
});
