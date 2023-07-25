const jwt = require('jsonwebtoken');
const {insertUser, checkUser} = require('./db'); // Import the insertUser function from your db.js file
const JWT_SECRET = 'jappy@123';


const handleSignUp = async (req, res) => {
  const { uidVal, pwdVal, uType } = req.body;
  if (!uidVal || !pwdVal || !uType) {
    return res.status(400).json({ message: 'Invalid request. uidVal and pwdVal are required.' });
  }

  try {
    const cheeck = await insertUser(uidVal, pwdVal, uType);
    console.log(cheeck);
    // Generate JWT token
    const token = jwt.sign({ uidVal, pwdVal, uType }, JWT_SECRET);
    console.log(token);
    // Set the token as a cookie and return it in the response
    res.cookie('Jwt', token).json({ message: 'Data inserted successfully!', token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error inserting data into the table' });
  }
};


const handleLogin = async (req, res) => {
  const { uidVal, pwdVal, uType } = req.body;
  if (!uidVal || !pwdVal || !uType) {
    return res.status(400).json({ message: 'Invalid request. uidVal and pwdVal are required.' });
  }

  try {
    // Check if the user exists in the database
    const userExists = await checkUser(uidVal, pwdVal, uType);
    console.log(userExists);
    if (userExists) {
      // Generate JWT token
      const token = jwt.sign({ uidVal, pwdVal, uType }, JWT_SECRET);
      console.log(token);
      // Set the token as a cookie and return it in the response
      res.cookie('Jwt', token).json({ message: 'Login successful!', token });
    } else {
      // Return a response indicating invalid credentials
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in' });
  }
}

module.exports = {
  handleSignUp,
  handleLogin,
};


