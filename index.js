// Import necessary modules and configure Express server

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

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



app.get('/get_requests', async (req, res) => {
    try {
      // Retrieve all travel requests from the database, excluding the __v field
      const travelRequests = await TravelRequest.find({}).lean().select('-__v').exec();
      res.status(200).json(travelRequests);
    } catch (err) {
      console.error('Failed to retrieve travel requests:', err);
      res.status(500).send('Failed to retrieve travel requests');
    }
  });
  

  app.delete('/delete_request/:id', async (req, res) => {
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
