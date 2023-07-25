const jwt = require('jsonwebtoken');
const {insertJournal, updateJournal, deleteJournal, publishJournal, teacherFeed, studentFeed, getJournalById, getCurrentDateTime} = require('./db'); // Import the insertUser function from your db.js file

// Secret key for JWT (this should be a secure random string in production)
const JWT_SECRET = 'jappy@123';

const handleJournalCreate = async (req, res) => {
    const token = req.cookies.Jwt;
    if (!token) return res.status(401).send('Log-In First');
  
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      if (req.user.uType !== 'teacher') return res.status(401).json({ message: 'Access Denied' });
  
      // Check if the teacher has an existing record in the journal table
      let description = null;
      let published_at = null;
      let attachment = null;
      let tagged_student = [];
  
      // Update temp variables with the values from the request body if provided
      if (req.body.description) {
        description = req.body.description;
      }
      if (req.body.published_at) {
        published_at = req.body.published_at;
      }
      if (req.body.attachment) {
        attachment = req.body.attachment;
      }
      if (req.body.tagged_student) {
        tagged_student = req.body.tagged_student;
      }
      console.log(tagged_student);
      // Call insertJournal with the updated temp variables
      const result = await insertJournal(description, published_at, attachment, tagged_student, req.user.uidVal);
      if (result) {
        console.log("Journal Created successfully");
        return res.json({ description, published_at, attachment, tagged_student });
      }
  
      console.log(verified);
      // res.send(req.user);
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
    // res.send('Journal Post');
  }
  

const handleJournalUpdate = async (req, res) => {
    const token = req.cookies.Jwt;
    if (!token) return res.status(401).send('Access Denied');
  
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      if (req.user.uType !== 'teacher') return res.status(401).json({ message: 'Access Denied' });
      
      // Check if the teacher has an existing record in the journal table
      let tempDescription = null;
      let tempAttachment = null;
      let tempTagged_student = [];

      // Update temp variables with the values from the request body if provided
      if (req.body.description) {
        tempDescription = req.body.description;
      }
      if (req.body.attachment) {
        tempAttachment = req.body.attachment;
      }
      if (req.body.tagged_student) {
        tempTagged_student = req.body.tagged_student;
      }
      const { journal_id } = req.body;
      // console.log(tempTagged_student);
  
      // Check if the journal post exists in the database
      const journalPost = await getJournalById(journal_id);
      if (!journalPost) {
        return res.status(404).json({ message: 'Journal post not found.' });
      }
  
      // Check if the teacher's unique identifier (uidVal) matches the identifier stored in the database for this journal entry
      if (req.user.uidVal !== journalPost.teacher_id) {
        return res.status(401).json({ message: 'Access Denied. You are not authorized to update this journal post.' });
      }
  
      // Update the journal post with the new attributes
      const result = await updateJournal(tempDescription, tempAttachment, tempTagged_student, journal_id);
      if (result) {
        console.log("Journal updated successfully");
        // const journalPost = await getJournalById(journal_id);
        const responseObj = {
          ...journalPost, // Spread operator to include all the attributes of the journal post
          tagged_student: tempTagged_student // Include the tagged_student in the response object
        };
        return res.json(responseObj);
      } else {
        console.log("Update failed");
        res.status(500).json({ message: 'Failed to update journal post.' });
      }
  
      console.log(verified);
      // res.send(req.user);
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
    // res.json({ message: 'Journal post updated successfully.' });
  }

const handleJournalDelete = async (req, res) => {
    const token = req.cookies.Jwt;
    if (!token) return res.status(401).send('Access Denied');
    
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
  
      if (req.user.uType !== 'teacher') return res.status(401).json({ message: 'Access Denied' });
  
      const { journal_id } = req.body;
      if (!journal_id) {
        return res.status(400).json({ message: 'Invalid request. journal_id is required.' });
      }
  
      // Check if the journal post exists in the database
      const journalPost = await getJournalById(journal_id);
      if (!journalPost) {
        return res.status(404).json({ message: 'Journal post not found.' });
      }
  
      // Check if the teacher's unique identifier (uidVal) matches the identifier stored in the database for this journal entry
      if (req.user.uidVal !== journalPost.teacher_id) {
        return res.status(401).json({ message: 'Access Denied. You are not authorized to delete this journal post.' });
      }
  
      const result = await deleteJournal(journal_id);
      if (result) {
        console.log("Deleted successfully");
        res.json({ message: 'Journal post deleted successfully.' });
      } else {
        console.log("Deletion failed");
        res.status(500).json({ message: 'Failed to delete journal post.' });
      }
  
      console.log(verified);
      // res.send(req.user);
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
    // res.send('Journal Deleted');
  }

 const handleJournalPublish = async (req,res) => {
    const token = req.cookies.Jwt;
    if(!token) return res.status(401).send('Access Denied');
    try{
      const verified = jwt.verify(token,JWT_SECRET);
      req.user = verified;
      if(req.user.uType != 'teacher') return res.status(401).json({ message: 'Access Denied' });
      // console.log(req.user.uidVal);
    const { description, attachment, tagged_student } = req.body;
    if (!description) {
      return res.status(400).json({ message: 'Invalid request. description, tagged_student and published_at are required.' });
    }
    else{
      const result = await publishJournal(description, attachment, tagged_student, req.user.uidVal);
      if(result){
        console.log("Journal Published successfully");
        return res.json({ description, attachment, tagged_student });
      }
      else{
        console.log("not posted");
      }
    }
    console.log(verified);
      // res.send(req.user);
    }catch(err){
      res.status(400).send('Invalid Token');
    }
    res.send('Journal Post');
  } 

  const handleJournalFeed = async (req, res) => {
    const token = req.cookies.Jwt;
    if (!token) return res.status(401).json({ message: 'Access Denied' });
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      console.log(req.user.uType, req.user.uidVal);
      if (req.user.uType === 'teacher') {
        const teacherJournals = await teacherFeed(req.user.uidVal);
        // console.log("Teacher Journals:", teacherJournals);
        res.json(teacherJournals); // Return the teacher's journals in the response
      } 
      else if(req.user.uType === 'student') {
        const studentJournals = await studentFeed(req.user.uidVal);
        console.log("Student Journals:", studentJournals);
        res.json(studentJournals); // Return the student's journals in the response
      }
      else {
        res.status(400).json({ message: 'Invalid user type' });
      }
    } catch (err) {
      res.status(400).send('Invalid Token');
    }
  }

const handleGetJournal = async (req,res) => {
    const {journal_id} = req.body;
    const results = await getJournalById(journal_id);
    // const temp = await ;
    const temp = await getCurrentDateTime();
    console.log(results.published_at,'\n',temp);
    if(results.published_at > temp){
      console.log("Greater\n");
    }
    else console.log("Less\n");
    res.send(results);
  }

  module.exports = {
    handleJournalCreate,
    handleJournalUpdate,
    handleJournalDelete,
    handleJournalPublish,
    handleJournalFeed,
    handleGetJournal,
  };
  