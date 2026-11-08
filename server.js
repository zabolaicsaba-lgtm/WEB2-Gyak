require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1); // Render reverse proxy

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 8 },
  })
);

app.locals.authors = "Készítők: [Név 1] ([NEPTUN1]), [Név 2] ([NEPTUN2])";

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use("/", require("./routes/main"));
app.use("/", require("./routes/auth"));
app.use("/crud", require("./routes/crud"));

app.use((req, res) => {
  res.status(404).render("error", { title: "Nem található", message: "A keresett oldal nem létezik." });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", { title: "Hiba", message: "Szerverhiba történt." });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB kapcsolat kész.");
    app.listen(port, () => console.log("Szerver PORT: " + port));
  })
  .catch((err) => {
    console.error("MongoDB hiba:", err.message);
    process.exit(1);
  });
