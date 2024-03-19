import express from "express";
import dotenv from "dotenv";
import { content } from "./services/getContent";
dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.get("/getContent", (req, res) => {
  const departments = req.query?.departments?.toString();
  if (!departments) {
    console.error(
      "Error: No departments given, use the query param 'departments' to pass in your department"
    );
    return res
      .status(400)
      .send(
        "400: Error, No departments given, use the query param 'departments' to pass in your department"
      );
  }
  try {
    const contentFetch = new content({
      elasticURL: process.env.ELASTIC_URL || "",
      username: process.env.ELASTIC_USERNAME || "",
      password: process.env.ELASTIC_PASSWORD || "",
    });
    contentFetch.getContent(departments || "");
    return res.status(200).send("Departments Saved!");
  } catch (e) {
    console.error("Error @ GET '/getContent' :", e);
    res.status(500).send("500: Internal server error");
  }
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});
