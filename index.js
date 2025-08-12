const express = require("express");
const face = require("./core");
const app = express();

app.use("/fb", face);
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
