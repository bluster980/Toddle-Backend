const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const {handleSignUp, handleLogin} = require('./userController');
const {handleJournalCreate, handleJournalUpdate, handleJournalDelete, handleJournalPublish, handleJournalFeed, handleGetJournal} = require('./journalController');
const {handleEndPoints} = require('./routeController');

// Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

 
// Define the GET request endpoint to display all project endpoints
app.get('/', handleEndPoints);
// Route for inserting data into the table
app.post('/signup', handleSignUp);
app.post('/login', handleLogin);
app.post('/journal-create', handleJournalCreate);
app.put('/journal-update', handleJournalUpdate);
app.delete('/journal-delete', handleJournalDelete);
app.post('/journal-publish', handleJournalPublish);
app.get('/journal-feed', handleJournalFeed);
app.get('/getJournal', handleGetJournal);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});