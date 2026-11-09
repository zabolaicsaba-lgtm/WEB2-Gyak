const express = require("express");
const { body, validationResult } = require("express-validator");
const { Np, Telepules, Ut, Message } = require("../models");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const [utCount, telCount, npCount] = await Promise.all([Ut.countDocuments(), Telepules.countDocuments(), Np.countDocuments()]);
    res.render("index", { title: "Főoldal", stats: { utCount, telCount, npCount } });
  } catch (e) {
    next(e);
  }
});

router.get("/adatbazis", async (req, res, next) => {
  try {
    const npId = Number(req.query.np) || null;
    const nps = await Np.find().sort({ nev: 1 }).lean();
    let telFilter = {};
    if (npId) telFilter = { npid: npId };
    const telepulesek = await Telepules.find(telFilter).sort({ nev: 1 }).populate("np").lean();
    let utFilter = {};
    if (npId) utFilter = { telepulesid: { $in: telepulesek.map((t) => t.id) } };
    const utak = await Ut.find(utFilter).sort({ nev: 1 }).populate({ path: "telepules", populate: { path: "np" } }).lean();
    res.render("adatbazis", { title: "Adatbázis", nps, telepulesek, utak, npId });
  } catch (e) {
    next(e);
  }
});

router.get("/kapcsolat", (req, res) => {
  res.render("kapcsolat", { title: "Kapcsolat", errors: {}, values: {} });
});

router.post(
  "/kapcsolat",
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("A név 2-80 karakter legyen."),
  body("email").trim().isEmail().withMessage("Érvénytelen e-mail cím."),
  body("subject").trim().isLength({ min: 3, max: 120 }).withMessage("A tárgy 3-120 karakter legyen."),
  body("message").trim().isLength({ min: 10, max: 2000 }).withMessage("Az üzenet 10-2000 karakter legyen."),
  async (req, res, next) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).render("kapcsolat", { title: "Kapcsolat", errors: result.mapped(), values: req.body });
      }
      const { name, email, subject, message } = req.body;
      await Message.create({ name, email, subject, message });
      req.session.flash = { type: "success", text: "Üzenetét elküldtük, köszönjük!" };
      res.redirect("/kapcsolat");
    } catch (e) {
      next(e);
    }
  }
);

router.get("/uzenetek", requireLogin, async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).lean();
    res.render("uzenetek", { title: "Üzenetek", messages });
  } catch (e) {
    next(e);
  }
});

router.get("/diagram", requireLogin, (req, res) => {
  res.render("diagram", { title: "Diagram" });
});

router.get("/diagram/adat", requireLogin, async (req, res, next) => {
  try {
    const [nps, telepulesek, utak] = await Promise.all([Np.find().lean(), Telepules.find().lean(), Ut.find().lean()]);
    const telToNp = new Map(telepulesek.map((t) => [t.id, t.npid]));
    const rows = nps
      .map((np) => {
        const list = utak.filter((u) => telToNp.get(u.telepulesid) === np.id);
        const total = list.reduce((s, u) => s + u.hossz, 0);
        return {
          nev: np.nev.replace(" Nemzeti Park Igazgatóság", ""),
          darab: list.length,
          atlagHossz: list.length ? Math.round((total / list.length) * 10) / 10 : 0,
        };
      })
      .sort((a, b) => b.darab - a.darab);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
