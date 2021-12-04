const express = require("express");
const cors = require("cors");
const { PORT, MONGO_URI } = require("./constants");
const mongoose = require("mongoose");

const main = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("connected to the database");
      app.listen(PORT, () => {
        console.log(`Server is running on ${PORT}`);
      });
    })
    .catch((err) => {
      console.log("Error: ", err);
    });

  app.use("/api", require("./routes/user"));
  app.use("/api", require("./routes/todo"));
};

main();
