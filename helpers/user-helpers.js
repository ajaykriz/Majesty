const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");
const nodeMailer = require("nodemailer");
const cartHelpers = require("./cart-helpers");
const { captureRejectionSymbol } = require("nodemailer/lib/ses-transport");
const ObjectID = require("mongodb").ObjectId;
const otpCode = Math.floor(1000 + Math.random() * 9999);
require('dotenv').config();
const Razorpay = require("razorpay");
const { log } = require("console");
const keyId = process.env.keyId;
const secretKey = process.env.secretKey;
var instance = new Razorpay({
  key_id:keyId,
  key_secret:secretKey,
});
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const otpCode = Math.floor(1000 + Math.random() * 8999);
      if (userData.pass == userData.repass) {
        let user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ email: userData.email });
        if (user) {
          console.log("user already exist");
          reject({ status: false, msg: "Email already taken" });
        } else {
          let mailTransporter = nodeMailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.NODEMAILER_USER,
              pass: process.env.NODEMAILER_PASS,
            },
          });
          let mailDetails = {
            form: "ajaykrishnan231@gmail.com",
            to: userData.email,
            subject: "testing",
            text: "otp is" + otpCode,
          };
          mailTransporter.sendMail(mailDetails, function (err, data) {
            if (err) {
              console.log("err");
            } else {
              console.log("emailsend");
            }
          });
          console.log(otpCode);
          console.log("lll");
          resolve({ msg: "success", otpCode });
        }
      } else console.log("passwords not match");
    });
  },

  otpverify: (otpData, otpCode, data) => {
    console.log(data);
    return new Promise(async (resolve, reject) => {
      if (otpCode == otpData.otp) {
        data.pass = await bcrypt.hash(data.pass, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(data)
          .then((response) => {
            resolve({ status: true });
          });
      } else {
        reject({ status: false, msg: "otp verification failed" });
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.pass, user.pass).then((status) => {
          if (status) {
            console.log("login success");
            response.user = user;
            response.status = true;
            console.log(response.user);
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed2");
        resolve({ status: false });
      }
    });
  },

  forgotpass: (data) => {
    return new Promise(async (resolve, reject) => {
      const fotpCode = Math.floor(1000 + Math.random() * 8999);

      console.log(data);
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: data.mail });
      //  console.log(data.email)
      if (user) {
        let mailTransporter = nodeMailer.createTransport({
          service: "gmail",
          auth: {
            user: "ajaykrishnan231@gmail.com",
            pass: "wtvpkzbgasirfcov",
          },
        });
        let mailDetails = {
          form: "ajaykrishnan231@gmail.com",
          to: data.mail,
          subject: "forgot",
          text: "otp is" + fotpCode,
        };
        mailTransporter.sendMail(mailDetails, function (err, data) {
          if (err) {
            console.log("err");
          } else {
            console.log("emailsend");
          }
        });
        console.log(otpCode);
        console.log("lll");
        resolve({ msg: "success", fotpCode });
      } else console.log("passwords not match");
    });
  },
  forgetOtpVerify: (otpData, otpCode, data) => {
    console.log(data);

    return new Promise(async (resolve, reject) => {
      console.log(otpCode);
      if (otpCode == otpData.otp) {
        resolve({ status: true });
      } else {
        reject({ status: false, msg: "otp verification failed" });
      }
    });
  },
  resetPassword: (data, user) => {
    return new Promise(async (resolve, reject) => {
      if (data.pass == data.repass) {
        data.password = await bcrypt.hash(data.pass, 10);
        console.log(user.mail);
        await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne({ email: user.mail }, { $set: { pass: data.password } });
        resolve({ status: true });
      } else {
        reject({ status: false, msg: "password not match" });
      }
    });
  },
  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .remove({ _id: ObjectID(userId) })
        .then((response) => {
          //console.log(response);
          resolve(response);
        });
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let User = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectID(userId) });
      if (User) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: ObjectID(userId) },
            { $set: { block: true } },
            { upsert: true }
          );
        resolve(User.name);
      }
    });
  },
  unblockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let User = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectID(userId) });
      if (User) {
        await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: ObjectID(userId) },
            { $set: { block: false } },
            { upsert: true }
          );
        resolve(User.name);
      }
    });
  },
  blockedUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      const User = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectID(userId) });
      if (User) {
        resolve(User.name);
      }
    });
  },placeOrder: (order, products, total) => {
    let couponOff = 0;
    return new Promise(async (resolve, reject) => {
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ coupon: order.coupon });
      if (coupon) {
        couponOff = coupon.offer;
      }

      let totalAmount = parseInt(order.mainTotal);
      let subTotal = parseInt(order.subTotal);
      let grandTotal = parseInt(order.amountToBePaid);

      let status = order.paymentMethod === "cod" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          firstName: order.fname,
          lastName: order.lname,
          mobile: order.phoneNumber,
          email: order.email,
          town: order.towncity,
          address: order.address,
          town: order.localplace,
          district: order.district,
          state: order.state,
          zip: order.pincode,
          localplace: order.localplace,
        },
        userId: ObjectID(order.userId),
        paymentMethod: order.paymentMethod,
        products: products,
        totalAmount: total,
        date: new Date(),
        status: status,
        subtotal: subTotal,
        totalAmountWithoutShipping: totalAmount,
        totalAmountPaid: grandTotal,
        totalAmountToBePaid: grandTotal,
        couponPercent: couponOff,
        couponDiscount: order.discountedPrice,
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          products.forEach(async (result) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectID(result.item)},
            { $inc: { stock: -result.quantity } })
          })
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: ObjectID(order.userId) });
            let userId = order.userId;
            userId = userId.toString();
            db.get()
              .collection(collection.COUPON_COLLECTION)
              .updateOne(
                { coupon: order.coupon },
                {
                  $push: { users: userId },
                  $inc: { limit: -1 }
                })
          resolve(response);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectID(userId) });
      resolve(cart.products);
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ user: ObjectID(userId) })
        .toArray();
      resolve(orders);
    });
  },
  //   totalAmount: (orderId) => {
  //     return new Promise(async (resolve, reject) => {
  //         const amount = await db
  //         .get()
  //         .collection(collection.ORDER_COLLECTION).find({ _id: ObjectID(orderId) })
  //         console.log('22222222222222222222222222'+amount)
  //       resolve(amount);
  //     });
  //   },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      const orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectID(orderId) },
          },
          {
            $unwind: "$products",
          },

          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
              status: "$products.orderStatus",
              //   totalAmount: 1,
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              status: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();
      //   console.log(orderItems);
      resolve(orderItems);
    });
  },
  getOrderedDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderedDetails = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: ObjectID(orderId) });
      //   console.log(orderedDetails);

      if (orderedDetails.paymentMethod == "razorpayPayment") {
        orderedDetails.RazorPay = true;
        resolve(orderedDetails);
      } else {
        resolve(orderedDetails);
      }
    });
  },
  generateRazorPay: (orderId, total) => {
    return new Promise(async (resolve, reject) => {
      var options = {
        amount: total * 100, //amount in the smallest currency
        currency: "INR",
        receipt: orderId.toString(),
      };
      instance.orders.create(options, function (error, order) {
        if (error) {
          console.log("Error", error);
        } else {
          console.log(
            "122222222222222222222222222222222222222222222222" + order
          );
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256",secretKey);

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");

      if (hmac == details["payment[razorpay_signature]"]) {
        console.log("same");
        resolve();
      } else {
        console.log("no match");
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectID(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  getProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectID(proId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  getAllOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: ObjectID(userId) })
        .toArray();
      // console.log(orders);
      resolve(orders);
    });
  },
  updateUserDetails: (userId, details) => {
    let address = {
      firstName: details.fname,
      lastName: details.lname,
      mobile: details.mobile,
      email: details.email,
      town: details.towncity,
      address: details.address,
      localplace: details.localplace,
      district: details.district,
      state: details.state,
      zip: details.pin,
      localplace: details.localplace,
      id: details.fname + new Date(),
    };

    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectID(userId) },
          {
            $push: { addresses: address },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({ _id: ObjectID(userId) })
        .toArray();
      // console.log(user.addresses);
      resolve(user[0].addresses);
    });
  },
  editUserProfile: (userId, data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectID(userId) },
          { $set: { name: data.name, address: data.address } }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  findUserAddress: (AddId, userId) => {
    return new Promise(async (resolve, reject) => {
      const address = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectID(userId) },
          },
          {
            $unwind: "$addresses",
          },
          {
            $match: { "addresses.id": AddId },
          },
          {
            $project: {
              addresses: 1,
              _id: 0,
            },
          },
        ])
        .toArray();

      resolve(address[0].addresses);
    });
  },
  editAddress: (id, userId, data) => {
    console.log(userId);
    console.log(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    console.log(id);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectID(userId), "addresses.id": id },
          {
            $set: {
              "addresses.$.firstName": data.fname,
              "addresses.$.lastName": data.lname,
              "addresses.$.address": data.address,
              "addresses.$.localplace": data.localplace,
              "addresses.$.town": data.towncity,
              "addresses.$.district": data.district,
              "addresses.$.state": data.state,
              "addresses.$.zip": data.pin,
              "addresses.$.mobile": data.mobile,
              "addresses.$.email": data.email,
            },
          }
        )
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },getSearchProducts: (key) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({
          $or: [
            { title: { $regex: new RegExp("^" + key + ".*", "i") } },
            { brand: { $regex: new RegExp("^" + key + ".*", "i") } },
            { category: { $regex: new RegExp("^" + key + ".*", "i") } },
          ],
        })
        .toArray();
      resolve(products);
    });
  }
};

