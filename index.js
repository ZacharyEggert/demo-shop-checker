import { ReverbApiClient } from "@zacharyeggert/reverb-api";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";

dotenv.config();

const server = express();

const { REVERB_API_KEY, MY_NOTIFIER_API_KEY, LOOP_INTERVAL_SECONDS, PORT } =
  process.env;

const apiClient = new ReverbApiClient(REVERB_API_KEY);

const loopIntervalSeconds = parseInt(LOOP_INTERVAL_SECONDS) || 30;

let numberOfListings;
let previousNumberOfListings;
let lastUpdated = new Date("2022-05-19T00:00:00.000Z");

const alertNewListings = () => {
  console.log("new listings!");
  lastUpdated = new Date();
  axios.post(
    "https://api.mynotifier.app",
    {
      apiKey: MY_NOTIFIER_API_KEY,
      message: "New Reverb Listings in the Gibson Demo Shop!",
      description: `${
        numberOfListings - previousNumberOfListings
      } new listings! Buy now or lose out.`,
    },
    { headers: { "Content-Type": "application/json" } }
  );
};

const checkNewListings = async () => {
  previousNumberOfListings = numberOfListings;

  const url = "https://api.reverb.com/api/listings/all?shop_id=1622762";
  const response = await apiClient.get(url);
  // fs.writeFileSync("data.json", JSON.stringify(response.data));

  numberOfListings = response.data.total;

  console.log(
    "updated, # of listings:",
    numberOfListings,
    "previous:",
    previousNumberOfListings
  );

  if (numberOfListings > previousNumberOfListings) {
    alertNewListings();
  } else if (numberOfListings < previousNumberOfListings) {
    console.log("something sold");
  }
};

checkNewListings();

const loop = setInterval(checkNewListings, 1000 * loopIntervalSeconds);

server.get("/", (req, res) => {
  res.send(
    `server is running, demo shop last added guitars ${
      Math.round(((Date.now() - lastUpdated) / 1000 / 60 / 60) * 100) / 100
    } hours ago`
  );
});

server.listen(parseInt(PORT) || 3000, () => {
  console.log("listening on port", PORT);
});
