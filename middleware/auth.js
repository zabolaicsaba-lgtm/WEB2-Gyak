exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.session.flash = { type: "warning", text: "A művelethez be kell jelentkezni." };
    return res.redirect("/login");
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).render("error", { title: "Hozzáférés megtagadva", message: "Ehhez az oldalhoz admin jogosultság kell." });
  }
  next();
};
