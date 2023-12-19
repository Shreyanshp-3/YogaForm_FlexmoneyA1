const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL connection configuration
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Update with your MySQL username
  password: '', // Update with your MySQL password
  database: 'user_auth', // Update with your desired database name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
    createTable();
  }
});

// Create 'users' table if not exists
const createTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `;

  db.query(query, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Table created or already exists');
    }
  });
};

// Check email uniqueness endpoint
app.post('/check-email', (req, res) => {
  const { email } = req.body;
  const query = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error checking email uniqueness:', err);
      res.status(500).json({ isUnique: false, error: err.message });
    } else {
      const isUnique = results[0].count === 0;
      res.json({ isUnique });
    }
  });
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  // Check email uniqueness
  const isUnique = await checkEmailUniqueness(email);

  if (!isUnique) {
    return res.status(400).json({ success: false, error: 'Email is not unique' });
  }

  // Proceed with signup if email is unique
  const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
  db.query(query, [email, password], (err) => {
    if (err) {
      console.error('Error signing up:', err);
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// Login endpoint
// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      res.status(500).json({ success: false, error: err.message });
    } else {
      if (results.length > 0) {
        // Login successful
        const user = results[0]; // Assuming the first result is the user data
        res.json({ success: true, user });
      } else {
        // Incorrect credentials
        res.json({ success: false, error: 'Invalid credentials' });
      }
    }
  });
});


// Function to check email uniqueness
const checkEmailUniqueness = (email) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) {
        console.error('Error checking email uniqueness:', err);
        reject(err);
      } else {
        const isUnique = results[0].count === 0;
        resolve(isUnique);
      }
    });
  });
};


// to upload the form data to the database
app.post('/confirm', (req, res) => {
  const { name, email, selectedDate, age, preferredBatch } = req.body;
  const query = 'INSERT INTO forms (name, email, selectedDate, age, preferredBatch) VALUES (?, ?, ?, ?, ?)';

  db.query(query, [name, email, selectedDate, age, preferredBatch], (err, results) => {
    if (err) {
      console.error('Error during confirmation:', err);
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});


// to get the data fo theform from the database if foind
// Retrieve form data based on user's email
app.get('/forms/:email', (req, res) => {
  const userEmail = req.params.email;
  const query = 'SELECT * FROM forms WHERE email = ?';

  db.query(query, [userEmail], (err, results) => {
    if (err) {
      console.error('Error fetching form data:', err);
      res.status(500).json({ success: false, error: err.message });
    } else {
      if (results.length > 0) {
        // Form data found, send it to the client
        const formData = results[0]; // Assuming there is only one record per email
        res.json({ success: true, formData });
      } else {
        // No form data found for the user's email
        res.json({ success: false, formData: null });
      }
    }
  });
});




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
