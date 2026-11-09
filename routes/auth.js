const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");

const router = express.Router();

router.get("/register", (req, res) => {
  res.render("register", { title: "Regisztráció", errors: {}, values: {} });
});

router.post(
  "/register",
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("A név 2-80 karakter legyen."),
  body("login").trim().isLength({ min: 3, max: 30 }).matches(/^[A-Za-z0-9_.-]+$/).withMessage("A felhasználónév 3-30 karakter, csak betű, szám és _ . - lehet."),
  body("password").isLength({ min: 6 }).withMessage("A jelszó legalább 6 karakter legyen."),
  body("password2").custom((v, { req }) => v === req.body.password).withMessage("A két jelszó nem egyezik."),
  async (req, res, next) => {
    try {
      const result = validationResult(req);
      const errors = result.mapped();
      if (result.isEmpty() && (await User.findOne({ login: req.body.login }))) {
        errors.login = { msg: "Ez a felhasználónév már foglalt." };
      }
      if (Object.keys(errors).length) {
        return res.status(400).render("register", { title: "Regisztráció", errors, values: req.body });
      }
      const hash = await bcrypt.hash(req.body.password, 10);
      await User.create({ name: req.body.name, login: req.body.login, password: hash, role: "user" });
      req.session.flash = { type: "success", text: "Sikeres regisztráció, jelentkezz be!" };
      res.redirect("/login");
    } catch (e) {
      next(e);
    }
  }
);

router.get("/login", (req, res) => {
  res.render("login", { title: "Bejelentkezés", error: null, values: {} });
});

router.post("/login", async (req, res, next) => {
  try {
    const login = String(req.body.login || "").trim();
    const user = await User.findOne({ login });
    const ok = user && (await bcrypt.compare(String(req.body.password || ""), user.password));
    if (!ok) {
      return res.status(401).render("login", { title: "Bejelentkezés", error: "Hibás felhasználónév vagy jelszó.", values: { login } });
    }
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: user._id.toString(), name: user.name, login: user.login, role: user.role };
      req.session.flash = { type: "success", text: "Üdv, " + user.name + "!" };
      res.redirect("/");
    });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
