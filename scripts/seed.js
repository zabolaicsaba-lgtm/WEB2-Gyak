require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Np, Telepules, Ut, User } = require("../models");

function readRows(file) {
  const text = fs.readFileSync(path.join(__dirname, "..", "data", file), "utf8").replace(/^\uFEFF/, "");
  return text.split(/\r?\n/).filter((l) => l.trim()).slice(1).map((l) => l.split("\t").map((c) => c.trim()));
}
const num = (s) => Number(String(s).replace(",", "."));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  await Promise.all([Np.deleteMany({}), Telepules.deleteMany({}), Ut.deleteMany({})]);

  await Np.insertMany(readRows("np.txt").map((r) => ({ id: num(r[0]), nev: r[1] })));
  await Telepules.insertMany(readRows("telepules.txt").map((r) => ({ id: num(r[0]), nev: r[1], npid: num(r[2]) })));
  // Az ut.txt-ben nincs azon oszlop, a sorszám lesz az azonosító.
  await Ut.insertMany(
    readRows("ut.txt").map((r, i) => ({
      azon: i + 1,
      nev: r[0],
      hossz: num(r[1]),
      allomas: num(r[2]),
      ido: num(r[3]),
      vezetes: num(r[4]) !== 0,
      telepulesid: num(r[5]),
    }))
  );

  const login = process.env.ADMIN_LOGIN || "admin";
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin123!", 10);
  await User.findOneAndUpdate({ login }, { name: "Admin", login, password: hash, role: "admin" }, { upsert: true });

  console.log("Kész:", await Np.countDocuments(), "np,", await Telepules.countDocuments(), "település,", await Ut.countDocuments(), "tanösvény.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
