const express = require("express");
const { body, validationResult } = require("express-validator");
const { Telepules, Ut } = require("../models");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAdmin);

const rules = [
  body("nev").trim().isLength({ min: 2, max: 120 }).withMessage("A név 2-120 karakter legyen."),
  body("hossz").customSanitizer((v) => String(v).replace(",", ".")).isFloat({ min: 0 }).withMessage("A hossz nem negatív szám legyen."),
  body("allomas").isInt({ min: 0 }).withMessage("Az állomások száma nem negatív egész legyen."),
  body("ido").customSanitizer((v) => String(v).replace(",", ".")).isFloat({ min: 0 }).withMessage("Az idő nem negatív szám legyen."),
  body("telepulesid").isInt({ min: 1 }).withMessage("Válassz települést."),
];

const getTelepulesek = () => Telepules.find().sort({ nev: 1 }).lean();

router.get("/", async (req, res, next) => {
  try {
    const utak = await Ut.find().sort({ azon: 1 }).populate({ path: "telepules", populate: { path: "np" } }).lean();
    res.render("crud/index", { title: "CRUD - Tanösvények", utak });
  } catch (e) {
    next(e);
  }
});

router.get("/new", async (req, res, next) => {
  try {
    res.render("crud/form", { title: "Új tanösvény", ut: {}, action: "/crud/new", telepulesek: await getTelepulesek(), errors: {} });
  } catch (e) {
    next(e);
  }
});

router.post("/new", rules, async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).render("crud/form", { title: "Új tanösvény", ut: req.body, action: "/crud/new", telepulesek: await getTelepulesek(), errors: result.mapped() });
    }
    const last = await Ut.findOne().sort({ azon: -1 }).lean();
    await Ut.create({
      azon: last ? last.azon + 1 : 1,
      nev: req.body.nev,
      hossz: req.body.hossz,
      allomas: req.body.allomas,
      ido: req.body.ido,
      vezetes: req.body.vezetes === "on",
      telepulesid: req.body.telepulesid,
    });
    req.session.flash = { type: "success", text: "Tanösvény létrehozva." };
    res.redirect("/crud");
  } catch (e) {
    next(e);
  }
});

router.get("/edit/:azon", async (req, res, next) => {
  try {
    const ut = await Ut.findOne({ azon: Number(req.params.azon) }).lean();
    if (!ut) return res.redirect("/crud");
    res.render("crud/form", { title: "Tanösvény szerkesztése", ut, action: "/crud/edit/" + ut.azon, telepulesek: await getTelepulesek(), errors: {} });
  } catch (e) {
    next(e);
  }
});

router.post("/edit/:azon", rules, async (req, res, next) => {
  try {
    const azon = Number(req.params.azon);
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).render("crud/form", { title: "Tanösvény szerkesztése", ut: { ...req.body, azon }, action: "/crud/edit/" + azon, telepulesek: await getTelepulesek(), errors: result.mapped() });
    }
    await Ut.updateOne(
      { azon },
      { nev: req.body.nev, hossz: req.body.hossz, allomas: req.body.allomas, ido: req.body.ido, vezetes: req.body.vezetes === "on", telepulesid: req.body.telepulesid }
    );
    req.session.flash = { type: "success", text: "Tanösvény módosítva." };
    res.redirect("/crud");
  } catch (e) {
    next(e);
  }
});

router.post("/delete/:azon", async (req, res, next) => {
  try {
    await Ut.deleteOne({ azon: Number(req.params.azon) });
    req.session.flash = { type: "success", text: "Tanösvény törölve." };
    res.redirect("/crud");
  } catch (e) {
    next(e);
  }
});

module.exports = router;
