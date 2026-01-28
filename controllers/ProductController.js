const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const ProductController = {

  // ---------------------------------------------------
  // LIST ALL PRODUCTS (ADMIN & USER VIEW)
  // ---------------------------------------------------
  listAll(req, res) {
    const user = req.session?.user || null;

    // ---------- ADMIN INVENTORY VIEW ----------
    if (user && user.role === 'admin') {
      const search = (req.query.search || '').trim();
      const categoryId = req.query.categoryId || '';
      const sort = req.query.sort || '';

      Category.getAll((err, categories) => {
        if (err) return res.status(500).send("Database error");

        Product.getAllFiltered(search, categoryId, sort, (err2, products) => {
          if (err2) return res.status(500).send("Database error");

          res.render('inventory', {
            products,
            user,
            categories,
            search,
            selectedCategoryId: categoryId,
            sort,
            orderCount: res.locals.orderCount || 0,
            messages: res.locals.messages || [],
            errors: res.locals.errors || []
          });
        });
      });

      return;
    }

    // ---------- USER SHOPPING VIEW ----------
    Category.getAll((err, categories) => {            
      if (err) return res.status(500).send("Database error");

      Product.getAll((err, products) => {             
        if (err) return res.status(500).send("Database error");

        // ⭐ ADD SUCCESS FLASH HERE
        const successMsg = (req.flash("success") || [])[0] || null;

        if (!user) {
          return res.render('shopping', {
            products,
            user,
            categories,   
            success: successMsg,      // ⭐ SEND SUCCESS TO EJS
            added: req.query.added === "true",
            qty: req.query.qty || null,
            name: req.query.name || null,
            cartCount: 0,
            orderCount: res.locals.orderCount || 0
          });
        }

        Cart.getOrCreateCart(user.id, (err, cart) => {
          if (err) return res.status(500).send("Database error");

          Cart.getCartItems(cart.id, (err, items) => {
            if (err) return res.status(500).send("Database error");

            res.render('shopping', {
              products,
              user,
              categories,
              success: successMsg,      // ⭐ SEND SUCCESS TO EJS
              added: req.query.added === "true",
              qty: req.query.qty || null,
              name: req.query.name || null,
              cartCount: items.length,
              orderCount: res.locals.orderCount || 0
            });
          });
        });
      });
    });
  },

  // ---------------------------------------------------
  // GET PRODUCT DETAILS
  // ---------------------------------------------------
  getById(req, res) {
    const productId = req.params.id;

    Product.getById(productId, (err, product) => {
      if (err) return res.status(500).send("Database error");
      if (!product) return res.status(404).send("Product not found");

      res.render('product', {
        user: req.session.user,
        product,
        orderCount: res.locals.orderCount || 0
      });
    });
  },

  // ---------------------------------------------------
  // SHOW ADD PRODUCT FORM
  // ---------------------------------------------------
  showAddForm(req, res) {
    Category.getAll((err, categories) => {
      if (err) return res.status(500).send("Database error");

      res.render('addProduct', {
        categories,
        user: req.session.user,
        orderCount: res.locals.orderCount || 0,
        errors: req.flash('error')
      });
    });
  },

  // ---------------------------------------------------
  // ADD PRODUCT (POST)
  // ---------------------------------------------------
  add(req, res) {
    const { productName, quantity, price, categoryId } = req.body;
    const image = req.file ? req.file.filename : null;

    const product = { 
      productName, 
      quantity: parseInt(quantity, 10), 
      price: parseFloat(price), 
      categoryId, 
      image 
    };

    Product.add(product, (err) => {
      if (err) {
        req.flash('error', 'Failed to add product. Please try again.');
        return res.redirect('/addProduct');
      }
      req.flash('success', `Product "${productName}" added successfully!`);
      res.redirect('/inventory');
    });
  },

  // ---------------------------------------------------
  // SHOW UPDATE PRODUCT FORM
  // ---------------------------------------------------
  showUpdateForm(req, res) {
    const id = req.params.id;

    Product.getById(id, (err, product) => {
      if (err) return res.status(500).send("Database error");
      if (!product) return res.status(404).send("Product not found");

      Category.getAll((err2, categories) => {
        if (err2) return res.status(500).send("Database error");

        res.render('updateProduct', {
          product,
          categories,
          user: req.session.user,
          orderCount: res.locals.orderCount || 0,
          errors: req.flash('error')
        });
      });
    });
  },

  // ---------------------------------------------------
  // UPDATE PRODUCT
  // ---------------------------------------------------
  update(req, res) {
    const id = req.params.id;
    const { productName, quantity, price, categoryId } = req.body;
    const image = req.file ? req.file.filename : req.body.existingImage;

    const product = { 
      productName, 
      quantity: parseInt(quantity, 10), 
      price: parseFloat(price), 
      categoryId, 
      image 
    };

    Product.update(id, product, (err) => {
      if (err) {
        req.flash('error', 'Failed to update product. Please try again.');
        return res.redirect(`/products/${id}/update`);
      }
      req.flash('success', `Product "${productName}" updated successfully!`);
      res.redirect('/inventory');
    });
  },

  // ---------------------------------------------------
  // DELETE PRODUCT
  // ---------------------------------------------------
  delete(req, res) {
    const productId = req.params.id;
    Product.delete(productId, (err) => {
      if (err) {
        req.flash('error', 'Failed to delete product. Please try again.');
        return res.redirect('/inventory');
      }
      req.flash('success', 'Product deleted successfully!');
      res.redirect('/inventory');
    });
  },

  // ---------------------------------------------------
  // ⭐ BULK RESTOCK (AJAX VERSION)
  // ---------------------------------------------------
  bulkRestock(req, res) {
    const ids = req.body.ids;
    const amount = parseInt(req.body.amount);

    if (!ids || ids.length === 0) {
        return res.json({ success: false, message: "No products selected." });
    }

    Product.bulkRestock(ids, amount, (err) => {
        if (err) return res.json({ success: false, message: "Database error" });

        return res.json({ success: true, message: `Successfully restocked ${ids.length} product(s) with +${amount} units!` });
    });
  },

  // ---------------------------------------------------
  // SHOW BULK RESTOCK PAGE (GET)
  // ---------------------------------------------------
  showBulkRestock(req, res) {
    const user = req.session?.user || null;
    Product.getAll((err, products) => {
      if (err) return res.status(500).send('Database error');

      res.render('bulkRestock', {
        products,
        user,
        orderCount: res.locals.orderCount || 0
      });
    });
  }

};

module.exports = ProductController;
