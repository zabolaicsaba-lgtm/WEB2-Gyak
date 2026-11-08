const mongoose = require("mongoose");
const { Schema } = mongoose;

const npSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  nev: { type: String, required: true },
});

const telepulesSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  nev: { type: String, required: true },
  npid: { type: Number, required: true },
});
telepulesSchema.virtual("np", {
  ref: "Np",
  localField: "npid",
  foreignField: "id",
  justOne: true,
});

const utSchema = new Schema({
  azon: { type: Number, required: true, unique: true },
  nev: { type: String, required: true, trim: true },
  hossz: { type: Number, required: true, min: 0 },
  allomas: { type: Number, required: true, min: 0 },
  ido: { type: Number, required: true, min: 0 },
  vezetes: { type: Boolean, default: false },
  telepulesid: { type: Number, required: true },
});
utSchema.virtual("telepules", {
  ref: "Telepules",
  localField: "telepulesid",
  foreignField: "id",
  justOne: true,
});

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  login: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

const messageSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = {
  Np: mongoose.model("Np", npSchema, "np"),
  Telepules: mongoose.model("Telepules", telepulesSchema, "telepules"),
  Ut: mongoose.model("Ut", utSchema, "ut"),
  User: mongoose.model("User", userSchema, "users"),
  Message: mongoose.model("Message", messageSchema, "messages"),
};
