const db = require("../config/connection");
const collection = require("../config/collection");
const { promises } = require("nodemailer/lib/xoauth2");
const { get } = require("express/lib/response");
const ObjectID = require("mongodb").ObjectId;
module.exports = {
  addtoCart: (proId, userId, brand) => {
    let proObj = {
      item: ObjectID(proId),
      quantity: 1,
      orderStatus: "ordered",
      orderCancel: false,
      brand: brand,
    };
    return new Promise(async (resolve, reject) => {
      const userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectID(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectID(userId), "products.item": ObjectID(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectID(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve(response);
            });
        }
      } else {
        const cartObj = {
          user: ObjectID(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },
  deleteProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { _id: ObjectID(details.wishlist) },
          {
            $pull: {
              products: { item: ObjectID(details.product) },
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  addtoWishlist: (proId, userId) => {
    let proObj = {
      item: ObjectID(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      const userwishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: ObjectID(userId) });
      if (userwishlist) {
        let proExist = userwishlist.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectID(userId), "products.item": ObjectID(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: ObjectID(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve(response);
            });
        }
      } else {
        const cartObj = {
          user: ObjectID(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      const cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectID(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
              // let: { prodList: '$products' },
              // pipeline: [{
              //     $match: {
              //         $expr: {
              //             $in: ['$_id', "$$prodList"]
              //         }
              //     }
              // }],
              // as: 'cartItems'
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  getWishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      const WishlistItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectID(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
              // let: { prodList: '$products' },
              // pipeline: [{
              //     $match: {
              //         $expr: {
              //             $in: ['$_id', "$$prodList"]
              //         }
              //     }
              // }],
              // as: 'cartItems'
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();
      resolve(WishlistItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectID(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: ObjectID(userId) });
      if (wishlist) {
        count = wishlist.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    console.log(details);
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectID(details.cart),
            },
            {
              $pull: { products: { item: ObjectID(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectID(details.cart),
              "products.item": ObjectID(details.product),
            },
            {
              $inc: {
                "products.$.quantity": details.count,
              },
            }
          )
          .then((response) => {
            resolve(response);
          });
      }
    });
  },
  removeItem: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          {
            _id: ObjectID(details.cart),
          },
          {
            $pull: { products: { item: ObjectID(details.product) } },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      const total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectID(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
              // let: { prodList: '$products' },
              // pipeline: [{
              //     $match: {
              //         $expr: {
              //             $in: ['$_id', "$$prodList"]
              //         }
              //     }
              // }],
              // as: 'cartItems'
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: [
                    { $toInt: "$quantity" },
                    { $toInt: "$product.price" },
                  ],
                },
              },
            },
          },
        ])
        .toArray();
      console.log(total);
      resolve(total[0].total);
    });
  },
  getSubtotal: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      let subtotal = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: {
              user: ObjectID(userId),
            },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
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
            $match: {
              item: ObjectID(proId),
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              unitPrice: { $toInt: "$product.price" },
              quantity: { $toInt: "$quantity" },
            },
          },
          {
            $project: {
              _id: null,
              subtotal: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
            },
          },
        ])
        .toArray();
      if (subtotal.length > 0) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { user: ObjectID(userId), "products.item": ObjectID(proId) },
            {
              $set: {
                "products.$.subtotal": subtotal[0].subtotal,
              },
            }
          )
          .then((response) => {
            console.log(response);
            resolve(subtotal[0].subtotal);
          });
      } else {
        subtotal = 0;
        resolve(subtotal);
      }
    });
  },
  changeCartSubtotal: (details) => {
    count = parseInt(details.count);
    quantity = parseInt(details.quantity);
    price = parseInt(details.price);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: ObjectID(details.cart) },
            {
              $pull: { products: { item: ObjectID(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        let subtotal = price * (quantity + count);
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectID(details.cart),
              "products.item": ObjectID(details.product),
            },
            {
              $set: { "products.$.subtotal": subtotal },
            }
          )
          .then((response) => {
            console.log(subtotal);
            console.log(response);
            resolve();
          });
      }
    });
  },
};
