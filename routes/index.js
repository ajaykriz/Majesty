const express = require("express");
const router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const cartHelpers = require("../helpers/cart-helpers");
/* GET home page. */
var filterResult
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};
router.get("/", async function (req, res, next) {
  const user = req.session.user;
  let cartCount = '';
  let wishlistCount = '';
  const brand=await productHelpers.getBrand()
  if (user) {
    [cartCount, wishlistCount] = await Promise.all([
      cartHelpers.getCartCount(req.session.user._id), cartHelpers.getWishlistCount(req.session.user._id)
    ])
  }
  productHelpers.getAllProducts().then((products) => {
    res.render("index", { user, products, cartCount, wishlistCount,brand });
  });
});
router.get("/login", function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  }
  res.render("login", { loginErr: req.session.loginErr });
  req.session.loginErr = false;
});
router.post("/login", (req, res) => {
  userHelpers
    .doLogin(req.body)
    .then((response) => {
      if (response.status) {
        if (response.user.block) {
          req.session.loggedIn = false;
          res.redirect("/login");
        } else {
          req.session.loggedIn = true;
          req.session.user = response.user;
          res.redirect("/");
        }
      } else {
        req.session.loginErr = true;
        res.redirect("/login");
      }
    })
    .catch(() => {
      res.redirect("/login");
    });
});
router.get("/signup", function (req, res, next) {
  res.render("signup");
});
router.post("/signup", function (req, res) {
  userHelpers
    .doSignup(req.body)
    .then((response) => {
      req.session.user = req.body;
      req.session.otp = response.otpCode;
      res.redirect("/otp");
    })
    .catch((error) => {
      res.redirect("/signup");
    });
});
router.get("/otp", (req, res) => {
  res.render("otp");
});
router.post("/otp", (req, res) => {
  userHelpers
    .otpverify(req.body, req.session.otp, req.session.user)
    .then((response) => {
      res.redirect("/login");
    })
    .catch((error) => {
      res.redirect("/otp");
    });
});
router.get("/forgot", function (req, res, next) {
  res.render("forgot");
});
router.get("/otp1", function (req, res, next) {
  res.render("otp1");
});
router.post("/forgot", function (req, res) {
  userHelpers
    .forgotpass(req.body)
    .then((response) => {
      req.session.forgotuser = req.body;
      req.session.forgototp = response.fotpCode;
      res.redirect("/otp1");
    })
    .catch((error) => {
      res.redirect("/forgot");
    });
}),
  router.post("/otp1", (req, res) => {
    userHelpers
      .forgetOtpVerify(req.body, req.session.forgototp, req.session.forgotuser)
      .then((response) => {
        res.redirect("/reset");
      })
      .catch((error) => {
        res.redirect("/otp1");
      });
  }),
  router.get("/reset", function (req, res, next) {
    res.render("reset");
  });
router.post("/reset", function (req, res, next) {
  userHelpers
    .resetPassword(req.body, req.session.forgotuser)
    .then((response) => {
      res.redirect("/login");
    })
    .catch((error) => {
      res.redirect("/otp1");
    });
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
router.get("/add-to-cart/:id", async (req, res) => {
  let product = await userHelpers.getProduct(req.params.id);
  brand = product.brand;
  cartHelpers
    .addtoCart(req.params.id, req.session.user._id, brand)
    .then((response) => {
      cartHelpers.getSubtotal(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true });
      });
      // res.redirect('/')
    });
});
router.post("/changeProductQuantity", (req, res, next) => {
  cartHelpers.changeProductQuantity(req.body).then((response) => {
    cartHelpers.changeCartSubtotal(req.body).then(async () => {
      response.total = await cartHelpers.getTotalAmount(req.body.user);
      res.json(response);
    });
  });
});
router.get("/add-to-wishlist/:id", (req, res) => {
  cartHelpers
    .addtoWishlist(req.params.id, req.session.user._id)
    .then((response) => {
      // res.redirect('/')
      res.json({ status: true });
    });
});
router.get("/cart", verifyLogin, async (req, res) => {
  let total = 0;
  const user = req.session.user;
  const products = await cartHelpers.getCartProducts(req.session.user._id);
  let count = products.length;
  if (products.length > 0){
    total = await cartHelpers.getTotalAmount(req.session.user._id);

  res.render("cart2", { user, products, total, count });
  }
  else{
    res.redirect('/emptyCart')
  }
});
router.post("/removeItem", (req, res) => {
  cartHelpers.removeItem(req.body).then((response) => {
    res.json(response);
  });
});
router.get("/placeOrder", verifyLogin, async (req, res) => {
  let total = await cartHelpers.getTotalAmount(req.session.user._id);
  let sum = parseInt(total);
  let grandTotal = sum + 40;
  let userId = req.session.user._id;
  let Addresses = await userHelpers.getAddress(userId);
  const coupon = await productHelpers.getAllCoupons();

  res.render("checkout", { userId, total, Addresses, coupon, grandTotal });
});
router.post("/couponApply", async (req, res) => {
  console.log(req.body);
  let todayDate = new Date().toISOString().slice(0, 10);
  productHelpers.startCouponOffer(todayDate).then(() => {
    let userId = req.session.user._id;
    productHelpers.validateCoupon(req.body, userId).then((response) => {
      req.session.couponTotal = response.total;
      if (response.success) {
        res.json({ couponSuccess: true, total: response.total });
      } else if (response.couponUsed) {
        res.json({ couponUsed: true });
      } else if (response.couponExpired) {
        res.json({ couponExpired: true });
      } else if (response.couponMaxLimit) {
        res.json({ couponMaxLimit: true });
      } else {
        res.json({ invalidCoupon: true });
      }
    });
  });
});
router.post("/placeOrder", async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = await cartHelpers.getTotalAmount(req.body.userId);

  userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    req.session.orderId = response.insertedId;
    response.codSuccess = true;
    if (req.body.paymentMethod == "cod") {
      res.json(response);
    } else {
      userHelpers
        .generateRazorPay(req.session.orderId, req.body.amountToBePaid)
        .then((response) => {
          res.json(response);
        });
    }
  });
}),
  router.get("/orderReceipt", verifyLogin, async (req, res) => {
    const user = req.session.user;
    // const totalAmount = await userHelpers.totalAmount(req.session.orderId)
    const orderProducts = await userHelpers.getOrderProducts(
      req.session.orderId
    );
    const orderedDetails = await userHelpers.getOrderedDetails(
      req.session.orderId
    );
    // let subtotal = orderedDetails.totalAmount
    // let GST = 0.08 * subtotal
    // let total = (subtotal + 40 + GST).toFixed(2)
    res.render("orderList", { user, orderProducts, orderedDetails });
  });
router.post("/verifyPayment", (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false });
    });
});
router.get("/userprofile", (req, res) => {
  const user = req.session.user;
  res.render("profile", { user });
});
router.get("/allOrders", verifyLogin, async (req, res) => {
  const user = req.session.user;
  const orders = await userHelpers.getAllOrders(user._id);
  res.render("orders", { orders });
});
router.get("/wishlist", verifyLogin, async (req, res) => {
  const user = req.session.user;
  const products = await cartHelpers.getWishlistProducts(req.session.user._id);
  let count = products.length;

  res.render("wishlist", { user, products, count });
});
router.get("/viewProduct/:id", async (req, res) => {
  let product = await userHelpers.getProduct(req.params.id);
  res.render("viewProduct", { product });
});
router.post("/wishlist-to-cart", (req, res) => {
  cartHelpers.addtoCart(req.body.product, req.body.user).then((response) => {
    cartHelpers.deleteProduct(req.body).then((response) => {
      res.json(response);
    });
  });
});
router.post("/delete-wishlist-product", (req, res) => {
  cartHelpers.deleteProduct(req.body).then((response) => {
    res.json(response);
  });
});
router.get("/address", verifyLogin, async (req, res) => {
  const user = req.session.user;
  let cartCount = ''
  let wishlistCount = ''
  let Addresses = await userHelpers.getAddress(user._id);
  if (user) {
    [cartCount, wishlistCount] = await Promise.all([
      cartHelpers.getCartCount(req.session.user._id), cartHelpers.getWishlistCount(req.session.user._id)
    ])
  }
  res.render("address", {
    ftwo: true,
    user,
    wishlistCount,
    cartCount,
    Addresses,
  });
});
router.get("/addAddress", verifyLogin, async (req, res) => {
  const user = req.session.user;
  let cartCount = ''
  let wishlistCount = ''
  if (user) {
    [cartCount, wishlistCount] = await Promise.all([
      cartHelpers.getCartCount(req.session.user._id), cartHelpers.getWishlistCount(req.session.user._id)
    ])
  }
  res.render("addAddress", { ftwo: true, user, wishlistCount, cartCount });
});
router.post("/addAddress", verifyLogin, (req, res) => {
  const user = req.session.user;
  userHelpers.updateUserDetails(user._id, req.body).then((response) => {
    // let Addresses = await userHelpers.getAddress(req.params.id)
    res.redirect("/address");
  });
});
router.get("/editProfile", (req, res) => {
  const user = req.session.user;
  res.render("editProfile", { user });
});
router.post("/editProfile-details", verifyLogin, (req, res) => {
  const user = req.session.user;
  userHelpers.editUserProfile(user._id, req.body).then((response) => {
    res.redirect("/profile");
  });
});
router.get("/editAddress/:id", verifyLogin, async (req, res) => {
  const address = await userHelpers.findUserAddress(
    req.params.id,
    req.session.user._id
  );
  const user = req.session.user._id;
  address.id = address.id.toString();
  res.render("editAddress", { address, user });
});
router.post("/editAddress/:id", async (req, res) => {
  userHelpers
    .editAddress(req.params.id, req.session.user._id, req.body)
    .then((response) => {
      res.redirect("/address");
    });
});
router.get("/orderReceipt/:id", verifyLogin, async (req, res) => {
  const user = req.session.user;
  // const totalAmount = await userHelpers.totalAmount(req.session.orderId)
  const orderProducts = await userHelpers.getOrderProducts(req.params.id);
  const orderedDetails = await userHelpers.getOrderedDetails(req.params.id);
  res.render("orderList", { user, orderProducts, orderedDetails });
});
router.post("/viewOrderSingle", (req, res) => {
  let status = false;
  productHelpers.getOneProduct(req.body).then((product) => {
    if (product[0].status == "Delivered") {
      product[0].delivered = true;
    } else if (product[0].status == "cancelled") {
      product[0].cancelled = true;
    }
    res.render("viewSingleProduct", { otp: true, product, status });
  });
});
router.post("/cancelSingleProductOrder", (req, res) => {
  productHelpers.cancelSingleProductOrder(req.body).then((response) => {
    console.log(response);
    res.json(response);
  });
});
router.post('/search-filter', (req, res) => {
  console.log(req.body);
  let data = req.body
  let price = parseInt(data.price)
  let brandFilter = []
  let cateFilter=[]
  for (let i of data.brand) {
    brandFilter.push({ 'brand': i })
  }
  for (let i of data.category) {
    cateFilter.push({ 'category': i })
  }
  productHelpers.searchFilter(brandFilter,cateFilter, price).then((result) => {
    filterResult = result
    res.json({ status: true })
  })
 
})
router.get('/shop', (req, res) => {
  productHelpers.getAllProducts().then(async(products) => {
    filterResult = products
    res.redirect('/filterPage')
  })
})
router.get('/filterPage', async (req, res) => {
  let cartCount = ''
  let wishlistCount = ''
  user = req.session.user
  if (user) {
    [cartCount, wishlistCount] = await Promise.all([
      cartHelpers.getCartCount(req.session.user._id), cartHelpers.getWishlistCount(req.session.user._id)
    ])
  }
  let brand = await productHelpers.getBrand()
  res.render('filterpage', { filterResult, brand, cartCount, wishlistCount, user })
})
router.get('/collection',(req,res)=>{
  res.render('collection')
})
router.post("/getSearchProducts",async (req, res) => {
  let key = req.body.key;
  filterResult = await userHelpers.getSearchProducts(key)
  res.redirect('/filterpage')
  
});
router.get('/emptyCart',(req,res)=>{
  res.render('emptyCart')
})
router.get('/getProducts/:id',async(req,res)=>{
  let key=req.params.id
  filterResult = await userHelpers.getSearchProducts(key)
  res.redirect('/filterpage')

})
module.exports = router;
