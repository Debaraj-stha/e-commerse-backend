const mongoose = require("mongoose");
const db = mongoose
  .connect("mongodb://localhost:27017/e_commerce", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));
module.exports = db;
