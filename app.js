const express = require("express");
const cors = require("cors");
//test
const app = express();
const authRoutes=require("./routes/authRoutes/authRoute")
const userRoutes=require("./routes/userRoutes/userRoute")
const customerRoutes=require("./routes/customerRoutes")
const orderRoutes=require("./routes/orderRoutes/orderRoutes")

app.use(cors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
    credentials: true
  }));
app.use(express.json({ limit: '50mb' })); // Increase the limit as needed
app.use(express.urlencoded({ limit: '50mb', extended: true })); // For URL-encoded data

app.use('/api/auth', authRoutes);
app.use('/api/user',userRoutes);
app.use('/api/customer',customerRoutes);
app.use('/api/order',orderRoutes);

module.exports = app;