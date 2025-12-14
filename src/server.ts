import express from "express";
import morgan from "morgan";
import "dotenv/config";
import path from "path";

import {
  deleteFilesFromCloudinary,
  generateDownloadUrl,
  signUploadRequest,
} from "./controllers/image_controller.js";
import upload from "./lib/multer.js";

const app = express();
app.set("view engine", "ejs");

app.use(morgan("dev"));
app.use(express.static(path.join(import.meta.dirname, "public")));
app.set("views", path.join(import.meta.dirname, "views"));
app.use(express.json());

const { PORT } = process.env;

app.get("/unsigned", (req, res) => {
  res.render("unsigned");
});

app.get("/upload-signature", signUploadRequest);
app.get("/download-url", generateDownloadUrl);
app.delete("/delete-files", deleteFilesFromCloudinary);

app.get("/", upload.none(), (req, res) => {
  const body = req.body;
  res.json({ body });
});

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
