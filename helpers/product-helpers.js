const db = require("../config/connection");
const collection = require("../config/collection");
const ObjectID = require("mongodb").ObjectId;
const moment = require("moment");
module.exports = {
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let userDetails = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(userDetails);
    });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  getWomenTshirt:()=>{
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({category:"WOMEN",subcategory:"T-shirts"}).limit(4)
        .toArray();
      resolve(products);
    });
  },getWomenShirt:()=>{
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({category:"WOMEN",subcategory:"Shirts"}).limit(4)
        .toArray();
      resolve(products);
    });
  },getWomenSaree:()=>{
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({category:"WOMEN",subcategory:"Saree"}).limit(4)
        .toArray();
      resolve(products);
    });
  },getMenTshirt:()=>{
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({category:"MEN",subcategory:"T-shirt"}).limit(4)
        .toArray();
      resolve(products);
    });
  },getMenShirt:()=>{
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({category:"MEN",subcategory:"Shirt"}).limit(4)
        .toArray();
      resolve(products);
    });
  },getMenJacket:()=>{
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({category:"MEN",subcategory:"Jacket"}).limit(4)
        .toArray();
      resolve(products);
    });
  },
  addProduct: (productData) => {
    productData.stock = parseInt(productData.stock);
    productData.price = parseInt(productData.price);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(productData)
        .then((result) => {
          resolve(result.insertedId);
        });
    });
  },
  addImage: (prodId, img1, img2, img3, img4) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectID(prodId) },
          {
            $set: {
              image: [
                { image1: img1 },
                { image2: img2 },
                { image3: img3 },
                { image4: img4 },
              ],
            },
          },
          { upsert: true }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  addBrand: (productData) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.BRAND_COLLECTION)
        .insertOne(productData)
        .then((result) => {
          resolve(result.insertedId);
        });
    });
  },
  addImagebrand: (prodId, img1) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.BRAND_COLLECTION)
        .updateOne(
          { _id: ObjectID(prodId) },
          {
            $set: {
              image: [{ images: img1 }],
            },
          },
          { upsert: true }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getBrand: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.BRAND_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .remove({ _id: ObjectID(userId) })
        .then((response) => {
          //console.log(response);
          resolve(response);
        });
    });
  },
  productDetail: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectID(id) })
        .then((prod) => {
          resolve(prod);
        });
    });
  },
  editProduct: (productData, proId, img1, img2, img3, img4) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectID(proId) },
          {
            $set: {
              category: productData.category,
              subcategory: productData.subcategory,
              title: productData.title,
              stock: parseInt(productData.stock),
              price: parseInt(productData.price),
              brand: productData.brand,
              image: [
                { image1: img1 },
                { image2: img2 },
                { image3: img3 },
                { image4: img4 },
              ],
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      const orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .toArray();
      resolve(orders);
    });
  },
  changeOrderStatus: (data) => {
    console.log(data);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          {
            _id: ObjectID(data.orderId),
            "products.item": ObjectID(data.proId),
          },
          {
            $set: {
              "products.$.orderStatus": data.orderStatus,
            },
          }
        )
        .then((response) => {
          console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT");
          console.log(response);
          resolve(response);
        });
    });
  },
  getOneProduct: (data) => {
    return new Promise(async (resolve, reject) => {
      let product = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectID(data.orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $match: { "products.item": ObjectID(data.proId) },
          },
          {
            $project: {
              quantity: "$products.quantity",
              item: "$products.item",

              status: "$products.orderStatus",
              subtotal: "$products.subtotal",

              couponPercent: "$couponPercent",
              couponDiscount: "$couponDiscount",
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
              couponPercent: 1,
              couponDiscount: 1,
              item: 1,
              quantity: 1,
              status: 1,
              subtotal: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();
      resolve(product);
    });
  },
  cancelSingleProductOrder: (data) => {
    let quantity = parseInt(data.quantity);
    discountPrice =
      parseInt(data.price) * quantity -
      (
        (parseInt(data.discountPercent) * parseInt(data.price) * quantity) /
        100
      ).toFixed(0);
    price = parseInt(data.price) * quantity;

    console.log(price);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateMany(
          { _id: ObjectID(data.orderId) },
          // {
          //   $pull:{products:{item:objectId(data.proId)}}
          // }      $pull:{products:{item:objectId(data.proId)}},

          {
            $inc: {
              totalAmountWithoutShipping: -discountPrice,
              subtotal: -price,
              totalAmountToBePaid: -discountPrice,
              amountToBeRefunded: discountPrice,
            },
          }
        )
        .then(async () => {
          await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              {
                _id: ObjectID(data.orderId),
                "products.item": ObjectID(data.proId),
              },
              {
                $set: {
                  "products.$.orderStatus": "cancelled",
                  "products.$.orderCancel": true,
                },
              }
            );

          let product = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $match: { _id: ObjectID(data.orderId) },
              },

              {
                $project: {
                  _id: 0,
                  products: 1,
                },
              },
              {
                $unwind: "$products",
                //   $unwind:'$deliveryDetails'
              },
              // {
              //   $project: {
              //     item: "$products.item",
              //     quantity: "$products.quantity",
              //     orderStatus: "$products.orderStatus",
              //   },
              // },
              {
                $match: { "products.orderCancel": false },
              },
            ])
            .toArray();
          console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
          console.log(product);
          console.log(product.length);
          if (product.length == 0) {
            console.log(
              "agbDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGG"
            );
            await db
              .get()
              .collection(collection.ORDER_COLLECTION)
              .updateMany(
                { _id: ObjectID(data.orderId) },
                {
                  $inc: { amountToBeRefunded: 40, totalAmountToBePaid: -40 },
                }
              );
            resolve({ status: true });
          } else {
            resolve({ status: true });
          }
        });
    });
  },
  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();

      resolve(coupons);
    });
  },
  addNewCoupon: (data) => {
    console.log(data);
    return new Promise(async (resolve, reject) => {
      let startDate = new Date(data.starting);
      let endDate = new Date(data.expiry);
      let expiry = moment(data.expiry).format("YYYY-MM-DD");
      let starting = moment(data.starting).format("YYYY-MM-DD");
      let dataObject = {
        coupon: data.coupon,
        offer: parseInt(data.offer),
        starting: starting,
        expiry: expiry,
        startDate: startDate,
        endDate: endDate,
        limit: parseInt(data.limit),
        users: [],
      };
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne(dataObject)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  deleteCoupon: (couponId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .remove({ _id: ObjectID(couponId) })
        .then(() => {
          resolve();
        });
    });
  },
  getOneCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ _id: ObjectID(couponId) });
      resolve(coupon);
    });
  },
  startCouponOffer: (date) => {
    console.log(
      "22222222222222222222222222222222222222222222222222222222222222222222222"
    );
    let couponStartDate = new Date(date);
    console.log(couponStartDate);
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find({ startDate: { $lte: couponStartDate } })
        .toArray();
      console.log(data);
      if (data) {
        await data.map(async (singleData) => {
          db.get()
            .collection(collection.COUPON_COLLECTION)
            .updateOne(
              { _id: ObjectID(singleData._id) },
              {
                $set: {
                  available: true,
                },
              },
              {
                upsert: true,
              }
            )
            .then((response) => {
              console.log(response);
              resolve(response);
            });
        });
      } else {
        resolve();
      }
    });
  },
  validateCoupon: (data, userId) => {
    console.log(data);
    return new Promise(async (resolve, reject) => {
      console.log(data.coupon);
      obj = {};
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ coupon: data.coupon, available: true });
      console.log(coupon);
      if (coupon) {
        if (coupon.limit > 0) {
          let users = coupon.users;
          let checkUserUsed = users.includes(userId);
          if (checkUserUsed) {
            obj.couponUsed = true;
            obj.msg = " You Already Used A Coupon";
            console.log(" You Already Used A Coupon");
            resolve(obj);
          } else {
            let nowDate = new Date();
            date = moment(nowDate).format("YYYY-MM-DD");
            console.log(date);
            if (date <= coupon.expiry) {
              let total = parseInt(data.total);
              let percentage = parseInt(coupon.offer);
              let discoAmount = ((total * percentage) / 100).toFixed();
              obj.total = total - discoAmount;
              obj.success = true;
              resolve(obj);
            } else {
              obj.couponExpired = true;
              console.log("This Coupon Is Expired");
              resolve(obj);
            }
          }
        } else {
          obj.couponMaxLimit = true;
          console.log("Used Maximum Limit");
          resolve(obj);
        }
      } else {
        obj.invalidCoupon = true;
        console.log("This Coupon Is Invalid");
        resolve(obj);
      }
    });
  },
  searchFilter: (brandFilter, cateFilter, price) => {
    return new Promise(async (resolve, reject) => {
      let result;
      console.log(brandFilter);
      if (brandFilter.length > 0 && cateFilter.length > 0) {
        result = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: { $or: brandFilter },
            },
            {
              $match: { $or: cateFilter },
            },
            {
              $match: { price: { $lt: price } },
            },
          ])
          .toArray();
      } else if (brandFilter.length > 0 && cateFilter.length == 0) {
        result = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: { $or: brandFilter },
            },
            {
              $match: { price: { $lt: price } },
            },
          ])
          .toArray();
      } else if (brandFilter.length == 0 && cateFilter.length > 0)
        result = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: { $or: cateFilter },
            },
            {
              $match: { price: { $lt: price } },
            },
          ])
          .toArray();
      else {
        result = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: { price: { $lt: price } },
            },
          ])
          .toArray();
      }
      console.log(result);
      resolve(result);
    });
  },
  salesReport: (data) => {
    let response = {};
    let { startDate, endDate } = data;

    let d1, d2, text;
    if (!startDate || !endDate) {
      d1 = new Date();
      d1.setDate(d1.getDate() - 7);
      d2 = new Date();
      text = "For the Last 7 days";
    } else {
      d1 = new Date(startDate);
      d2 = new Date(endDate);
      text = `Between ${startDate} and ${endDate}`;
    }

    // Date wise sales report
    const date = new Date(Date.now());
    const month = date.toLocaleString("default", { month: "long" });

    return new Promise(async (resolve, reject) => {
      let salesReport = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              date: {
                $lt: d2,
                $gte: d1,
              },
            },
          },
          {
            $match: { status: "placed" },
          },
          {
            $group: {
              _id: { $dayOfMonth: "$date" },
              total: { $sum: "$totalAmountToBePaid" },
            },
          },
        ])
        .toArray();

      let brandReport = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { status: "placed" },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              brand: "$products.brand",
              quantity: "$products.quantity",
            },
          },
          {
            $group: {
              _id: "$brand",
              totalAmount: { $sum: "$quantity" },
            },
          },
        ])
        .toArray();

      let orderCount = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ date: { $gt: d1, $lt: d2 } })
        .count();

      let totalAmounts = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { status: "placed" },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$totalAmountPaid" },
            },
          },
        ])
        .toArray();

      let totalAmountRefund = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { status: "placed" },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amountToBeRefunded" },
            },
          },
        ])
        .toArray();

      console.log(
        "5555555555555555555555555555555555555555555555555555555555555555555555"
      );
      console.log(totalAmountRefund);

      response.salesReport = salesReport;
      response.brandReport = brandReport;
      response.orderCount = orderCount;
      response.totalAmountPaid = totalAmounts[0].totalAmount;
      response.totalAmountRefund = totalAmountRefund[0].totalAmount;

      resolve(response);
    });
  },
};
