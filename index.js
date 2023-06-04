// Import necessary modules and configure Express server

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import {generateToken, comparePassword} from './auth.js';
import jwt from 'jsonwebtoken';


import 'dotenv/config';

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a schema for the travel request
const travelRequestSchema = new mongoose.Schema({
  destination: String,
  interests: String,
  numTravelers: Number,
  costPerPerson: Number,
  email:String
});


// Create a model based on the schema
const TravelRequest = mongoose.model('TravelRequest', travelRequestSchema);


// Create a schema for the admin user
const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});


// Create a model based on the schema
const Admin = mongoose.model('Admin', adminSchema);


app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin
    const admin = new Admin({
      username,
      password: hashedPassword,
    });

    // Save the admin to the database
    await admin.save();

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Failed to create admin:', error);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});



// API endpoint for admin login
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the admin user in the database
    const admin = await Admin.findOne({ username });

    // If admin user not found
    if (!admin) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Compare passwords
    const isPasswordMatch = await comparePassword(password, admin.password);

    // If passwords do not match
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Generate JWT token
    const token = generateToken(admin._id);

    // Send the token in the response
    res.json({ token });
  } catch (error) {
    console.error('Failed to authenticate admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Protect the admin routes with authentication middleware

// Middleware to verify the token
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Remove the "Bearer " prefix from the token
  const formattedToken = token.replace('Bearer ', '');

  jwt.verify(formattedToken, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.adminId = decodedToken.userId;
    next();
  });
};


// Protected admin route
app.get('/admin/dashboard', authenticateAdmin, (req, res) => {
  // Access the adminId from the request object
  const adminId = req.adminId;

  // Your logic for the admin dashboard

  res.json({ message: 'Admin dashboard' });
});

// API endpoint to handle form submission and save values to the database
app.post('/travel-request', async (req, res) => {
  try {
    // Retrieve values from the request body
    const { destination, interests, numTravelers, costPerPerson, email } = req.body;

    // Create a new travel request document
    const newTravelRequest = new TravelRequest({
      destination,
      interests,
      numTravelers,
      costPerPerson,
      email
    });

    // Save the document to the database
    await newTravelRequest.save();

    res.status(200).send('Travel request saved successfully');
  } catch (err) {
    console.error('Failed to save travel request:', err);
    res.status(500).send('Failed to save travel request');
  }
});



app.get('/get_requests', authenticateAdmin, async (req, res) => {
    try {
      // Retrieve all travel requests from the database, excluding the __v field
      const travelRequests = await TravelRequest.find({}).lean().select('-__v').exec();
      res.status(200).json(travelRequests);
    } catch (err) {
      console.error('Failed to retrieve travel requests:', err);
      res.status(500).send('Failed to retrieve travel requests');
    }
  });
  

  app.delete('/delete_request/:id',authenticateAdmin,  async (req, res) => {
    try {
      const requestId = req.params.id;
  
      // Find and delete the travel request by its ID
      const deletedRequest = await TravelRequest.findByIdAndDelete(requestId);
  
      if (!deletedRequest) {
        res.status(404).send('Travel request not found');
      } else {
        res.status(200).json(deletedRequest);
      }
    } catch (err) {
      console.error('Failed to delete travel request:', err);
      res.status(500).send('Failed to delete travel request');
    }
  });
  
  
  

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
