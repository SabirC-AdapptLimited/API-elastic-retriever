import express from "express";
import dotenv from "dotenv";
import { content } from "./services/getContent";
import { compareSync } from "bcrypt";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.get("/getContent", async (req, res) => {
  const authorizationHeader = req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.toLowerCase().startsWith("bearer ")
  ) {
    console.error("Invalid API key format");
    return res
      .status(401)
      .json({ error: "Unauthorized. API key is missing or invalid." });
  }

  const apiKey = authorizationHeader.slice(7);

  if (!compareSync(apiKey, process.env.API_KEY_HASH || "")) {
    console.error("Invalid API key used");
    return res
      .status(401)
      .json({ error: "Unauthorized. API key is missing or invalid." });
  }

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
    await contentFetch.getContent(departments || "");
    return res.status(200).send("Departments Saved!");
  } catch (e) {
    console.error("Error @ GET '/getContent' :", e);
    return res.status(500).send("500: Internal server error");
  }
});

app.get("/healthcheck", (_req, res) => res.sendStatus(200));

app.listen(port, () => {
  console.log("Server is running on port", port);
});
