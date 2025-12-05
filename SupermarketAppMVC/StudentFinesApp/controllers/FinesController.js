const Fine = require("../models/Fine");
const User = require("../models/User");
const CartItems = require("../models/CartItem");

const FinesController = {
  // List all fines for the logged-in user
  list(req, res) {
    const userId = req.session.user && req.session.user.userId;
    if (!userId) return res.status(401).send("Unauthorized");
      res.status(410).send('Student fines feature has been removed.');
  },

  // Get details for a specific fine
  getDetails(req, res) {
    const fineId = req.params.id;
      res.status(410).send('Student fines feature has been removed.');
  },

  // Mark selected fines as paid and remove them from cart
  pay(req, res) {
    const fineIds = req.body["fineIds[]"] || req.body.fineIds || [];
    const ids = Array.isArray(fineIds) ? fineIds : [fineIds];
    if (!ids.length || !ids[0]) {
      req.flash("error", "No fines selected for payment.");
      return res.redirect("/fines");
    }
      res.status(410).send('Student fines feature has been removed.');
  },

  showFineUserForm(req, res) {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send("Forbidden2");
    }
    User.getAll((err, users) => {
      if (err) return res.status(500).send("Error retrieving users");
      Fine.getFineTypes((err2, fineTypes) => {
        if (err2) return res.status(500).send("Error retrieving fine types");
        res.render("fineUser", { users, fineTypes, user: req.session.user });
      });
    });
  },

  fineUser(req, res) {
    console.log("Fine User Request Body:", req.body);
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send("Forbidden2");
    }
    const { userId, fineTypeId, amount, description } = req.body;
    Fine.addFine(
      {
        userId,
        fineTypeId,
        amount,
        description,
        paid: false,
      },
      (err) => {
        if (err) {
          req.flash("error", "Could not fine user");
          return res.redirect("/admin/fine-user");
        }
        req.flash("success", "Fine assigned to user");
        res.redirect("/admin/dashboard");
      }
    );
  },

  adminDashboard(req, res) {
    console.log("Admin Dashboard Accessed by:", req.session.user);
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send("Forbidden");
    }
    User.getAll((err, users) => {
      if (err) return res.status(500).send("Error retrieving users");
      Fine.getAllWithUserAndType((err2, fines) => {
        if (err2) return res.status(500).send("Error retrieving fines");
        res.render("adminDashboard", { users, fines, user: req.session.user });
      });
    });
  },
};

module.exports = FinesController;
