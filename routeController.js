
// Define an array to store all the project endpoints
const projectEndpoints = [
    { method: 'POST', path: '/signup', description: 'Sign up a new user' },
    { method: 'POST', path: '/login', description: 'Login and generate a JWT token' },
    { method: 'POST', path: '/journal-create', description: 'Create a new journal entry' },
    { method: 'PUT', path: '/journal-update', description: 'Update an existing journal entry' },
    { method: 'DELETE', path: '/journal-delete', description: 'Delete a journal entry' },
    { method: 'POST', path: '/journal-publish', description: 'Publish a journal entry' },
    { method: 'GET', path: '/journal-feed', description: 'Get a feed of journals' },
    { method: 'GET', path: '/getJournal', description: 'Get a single journal by ID' }
  ];
  

const handleEndPoints = (req, res) => {
    res.json(projectEndpoints);
  }

module.exports = {
    handleEndPoints,
}
    