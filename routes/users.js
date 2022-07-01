const express = require("express");
const router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const storage = require("../middlewares/multer");
const multer = require("multer");

/* GET users listing. */
router.get("/home", function (req, res, next) {
  let adm = req.session.admin;
  res.render("admin/index", { admin: true, adm });
});
router.get("/", function (req, res, next) {
  if (req.session.login) {
    res.redirect("/users/home");
  }
  res.render("admin/signin", { layout: false });
});

router.post("/login", function (req, res, next) {
  const Email = "ajaykrishnan231@gmail.com";
  const Password = 12345;
  if (req.body.email == Email && req.body.Password == Password) {
    req.session.admin = req.body;
    req.session.login = true;

    res.redirect("/users/home");
  } else {
    req.session.adminlogerr = true;
    res.redirect("/users");
  }
}),
  router.get("/allusers", function (req, res, next) {
    const alert = req.flash("msg");
    productHelpers.getAllUsers().then((userdetails) => {
      console.log(userdetails);

      res.render("admin/allusers", { admin: true, userdetails, alert });
    });
  });
router.get("/allproducts", function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    console.log(products);
    res.render("admin/allproducts", { admin: true, products });
  });
});
router.get("/addproduct", function (req, res) {
  productHelpers.getBrand().then((brand) => {
    res.render("admin/addproduct", { admin: true, brand });
  });
});
router.post(
  "/addproduct",
  storage.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  function (req, res) {
    console.log(req.body);
    console.log(req.files);

    productHelpers.addProduct(req.body).then((prodId) => {
      let img1 = req.files.image1[0].filename;
      let img2 = req.files.image2[0].filename;
      let img3 = req.files.image3[0].filename;
      let img4 = req.files.image4[0].filename;
      console.log(img1, img2, img3, img4);
      console.log(prodId);

      productHelpers.addImage(prodId, img1, img2, img3, img4).then(() => {
        res.redirect("/users/allproducts");
      });
    });
  }
);
router.get("/brand", function (req, res) {
  productHelpers.getBrand().then((brand) => {
    res.render("admin/brand", { admin: true, brand });
  });
});
router.get("/addbrand", function (req, res) {
  res.render("admin/addbrand", { admin: true });
});
router.post(
  "/addbrand",
  storage.fields([{ name: "img", maxCount: 1 }]),
  function (req, res) {
    console.log(req.body);
    console.log(req.files);

    productHelpers.addBrand(req.body).then((prodId) => {
      let img = req.files.img[0].filename;

      console.log(img);
      console.log(prodId);

      productHelpers.addImagebrand(prodId, img).then(() => {
        res.redirect("/users/brand");
      });
    });
  }
);
router.get("/delete-user/:id", (req, res) => {
  let userId = req.params.id;
  console.log(userId);
  userHelpers.deleteUser(userId).then((response) => {
    res.redirect("/users/allusers");
  });
});
router.get("/blockUser/:id", (req, res) => {
  let ID = req.params.id;
  userHelpers.blockUser(ID).then((userName) => {
    req.session.loggedIn = false;
    req.flash("msg", "You Blocked " + userName);
    res.redirect("/users/allusers");
  });
});
router.get("/unblockUser/:id", (req, res) => {
  let ID = req.params.id;
  userHelpers.unblockUser(ID).then((userName) => {
    req.session.userLoggedIn = true;
    req.flash("msg", "You Unblocked  " + userName);
    res.redirect("/users/allusers");
  });
});
router.get("/deleteProduct/:id", (req, res) => {
  let userId = req.params.id;
  console.log(userId);
  productHelpers.deleteProduct(userId).then((response) => {
    res.redirect("/users/allproducts");
  });
});
router.get("/editProduct/:id", async (req, res) => {
  const prodData = await productHelpers.productDetail(req.params.id);
  productHelpers.getBrand().then((brand) => {
    res.render("admin/editProduct", { admin: true, prodData, brand });
  });
});
router.post(
  "/editProduct/:id",
  storage.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  function (req, res) {
    // console.log(req.body);
    // console.log(req.files);
    const img1 = req.files.image1
      ? req.files.image1[0].filename
      : req.body.image1;
    const img2 = req.files.image2
      ? req.files.image2[0].filename
      : req.body.image2;
    const img3 = req.files.image3
      ? req.files.image3[0].filename
      : req.body.image3;
    const img4 = req.files.image4
      ? req.files.image4[0].filename
      : req.body.image4;
    productHelpers
      .editProduct(req.body, req.params.id, img1, img2, img3, img4)
      .then((prodId) => {
        res.redirect("/users/allproducts");
      });
  }
);
router.get("/orderManagement", async (req, res) => {
  const orders = await productHelpers.getAllOrders();
  // console.log(orders)
  res.render("admin/orderManagement", { admin: true, orders });
});
router.get("/orderedProducts/:id", async (req, res) => {
  const orderProducts = await userHelpers.getOrderProducts(req.params.id);
  const orderedDetails = await userHelpers.getOrderedDetails(req.params.id);
  console.log(orderProducts.status);
  res.render("admin/orderReceipt", {
    admin: true,
    orderProducts,
    orderedDetails,
  });
});
router.post("/changeOrderStatus", (req, res) => {
  // console.log(req.body);
  productHelpers.changeOrderStatus(req.body).then(async (response) => {
    const orderProducts = await userHelpers.getOrderProducts(req.body.orderId);
    const orderedDetails = await userHelpers.getOrderedDetails(
      req.body.orderId
    );
    // let subtotal = orderedDetails.totalAmount
    // let GST = 0.08 * subtotal
    // let total = subtotal + 40 + GST
    res.render("admin/orderReceipt", {
      admin: true,
      ftwo: true,
      orderProducts,
      orderedDetails,
    });
  });
});
router.get("/coupon", async (req, res) => {
  productHelpers.getAllCoupons().then((coupons) => {
    let alert = req.flash("msg");

    res.render("admin/coupon",{ alert,coupons,admin:true});
  });
});
router.get('/add-coupon', (req, res) => {
  res.render('admin/addCoupon', { admin: true, otp: true })
})
router.post("/add-coupon", (req, res) => {
  productHelpers
    .addNewCoupon(req.body)
    .then(() => {
      req.flash("msg", "New Coupon Added");
      res.redirect("/users/coupon");
    })
    .catch((err) => {
      console.log(err);
    });
});
router.get('/deleteCoupon/:id', (req, res) => {

  productHelpers.deleteCoupon(req.params.id).then(() => {
    res.redirect('/users/coupon')
  })
})
 
router.get('/editCoupon/:id', (req, res) => {

  productHelpers.getOneCoupon(req.params.id).then((coupon) => {
    res.render('admin/editCoupon', { admin: true, otp: true, coupon })
  })


});

router.post('/editCoupon/:id', (req, res) => {

  productHelpers.getOneCoupon(req.params.id).then((coupon) => {
    res.render('admin/editCoupon', { admin: true, otp: true, coupon })
  })


});
router.post('/getData', async (req, res) => {
  console.log(req.body, 'req.body');
  const date = new Date(Date.now());
  const month = date.toLocaleString("default", { month: "long" });
  productHelpers.salesReport(req.body).then((data) => {

    let pendingAmount = data.pendingAmount
    let salesReport = data.salesReport
    let brandReport = data.brandReport
    let orderCount = data.orderCount
    let totalAmountPaid = data.totalAmountPaid
    let totalAmountRefund = data.totalAmountRefund

    let dateArray = [];
    let totalArray = [];
    salesReport.forEach((s) => {
      dateArray.push(`${month}-${s._id} `);
      totalArray.push(s.total);
    })
    let brandArray = [];
    let sumArray = [];
    brandReport.forEach((s) => {
      brandArray.push(s._id);
      sumArray.push(s.totalAmount);
    });
    console.log("", brandArray);
    console.log("", sumArray);
    console.log("", dateArray);
    console.log("", totalArray);
    res.json({ dateArray, totalArray, brandArray, sumArray, orderCount, totalAmountPaid, totalAmountRefund, pendingAmount })
  })
})

module.exports = router;
