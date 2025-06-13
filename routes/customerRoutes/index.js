const express = require("express");
const router = express.Router();
const customerController = require("../../controller/customer/customer");

router.post("/add", customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomer);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
