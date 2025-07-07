require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/Users/user");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require('bcrypt');

//connection to db
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//sample data For users
const userData = [
  //Admin
  {
    uuid: uuidv4(),
    fullName: "Admin User",
    email: "admin@gmail.com",
    phone: "9007453398",
    password: "123456",
    role: "Admin",
    assignedOrders: [],
  },
  //Employees
  {
    uuid: uuidv4(),
    fullName: "Abhishek Hazra",
    email: "abhi@gmail.com",
    phone: "9007453397",
    password: "123456",
    role: "Employee",
    assignedOrders: [],
  },
  {
    uuid: uuidv4(),
    fullName: "Hemant Jain",
    email: "hemant@gmail.com",
    phone: "9007453396",
    password: "123456",
    role: "Employee",
    assignedOrders: [],
  },
  {
    uuid: uuidv4(),
    fullName: "Sankha Ghosh",
    email: "sankha@gmail.com",
    phone: "9007453395",
    password: "123456",
    role: "Employee",
    assignedOrders: [],
  },
];

const seedDatabase = async () => {
  //Start The Session
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await User.deleteMany({});
    console.log("Deleting Users");

    
    const savedUsers = [];
    for (const data of userData) {
      const user = new User({
        ...data,
        assignedOrders: [],
        status: 'active'
      });
      
      // This will trigger the pre-save hook to hash the password
      const savedUser = await user.save();
      savedUsers.push(savedUser);
    }

    console.log(`Inserted ${savedUsers.length} users`);
    session.commitTransaction();
  } catch (error) {
    console.log("Seeding Error...", error.message);
  } finally {
    mongoose.disconnect();
  }
};

seedDatabase();
