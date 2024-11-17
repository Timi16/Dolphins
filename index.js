const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const rewardRoutes = require('./routes/rewardRoutes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Import Routes
const userRoutes = require('./routes/userRoutes');

app.use(express.static('public'));

// Routes Middleware (Ensure the route starts with a `/`)
app.use('/api/user', userRoutes);
app.use('/api/rewards', rewardRoutes);

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

