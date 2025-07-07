require("dotenv").config();
const mongoose = require("mongoose");
const Customers = require("../models/Customer/Customer");
const { faker } = require("@faker-js/faker/locale/en_IN");

const generateCustomer = () => ({
  name: faker.person.fullName(),
  number: faker.phone.number("9#########"),
  email: faker.internet.email(),
  address: {
    plotApartment: faker.location.buildingNumber(),
    streetAddress1: faker.location.street(),
    streetAddress2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    pin: faker.location.zipCode("######").slice(0, 6), // Ensure 6-digit PIN
  },
});

// Generate 10 random customers
const randomCustomers = Array.from({ length: 10 }, generateCustomer);
//Connect To Db

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });



const seedDatabase = async () => {
  //start the Session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    //delete existing customers
    await Customers.deleteMany({});
    console.log("Deleting Customers");

    const createdCustomers = await Customers.insertMany(randomCustomers);
    console.log(`Created ${createdCustomers.length} customers`);
    session.commitTransaction();
  } catch (error) {
    console.log("Seeding Error...", error.message);
  } finally {
    mongoose.disconnect();
  }
};

seedDatabase();
