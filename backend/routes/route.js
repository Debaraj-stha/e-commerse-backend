const {
  userModel,
  productModel,
  shopModel,
  soldModel,
  orderModel,
  questionModel,
  reviewModel,
  messageModel,
  userMessageModel,
  messageToShopModel,
} = require("../schema/schema");
const bcrypt = require("bcrypt");
const router = require("express").Router();
const mongoose = require("mongoose");
const moment = require("moment");
const http = require("http");
const oneSignalConff = require("../config/onseSignalCongif");
const OneSignal = require("onesignal-node");
router.get("/", function (req, res) {
  res.send("working");
});

router.post("/login", async (req, res) => {
  try {
    console.log(req.body);
    const { name, phone, image, email, password } = req.body;

    //     const saltRounds = 10;
    //     const salt = await bcrypt.genSalt(saltRounds);
    //     const hash = await bcrypt.hash(email, salt);
    // await bcrypt.compare("data",encryptedData).then((resut)=>{

    // })
    const user = new userModel({
      password: password != "" ? password : null,
      phone: phone != "" ? phone : null,
      name: name,
      email: email != "" ? email : null,
      image: image != "" ? image : image,
    });

    await user.save({ setTimeout: 3000 });

    const doc = await userModel.findOne({
      $or: [{ phone: phone }, { email: email }],
    });

    if (doc) {
      const modifiedDoc = {
        ...doc.toObject(),
        id: doc._id.toString(),
      };

      delete modifiedDoc._id;
      res
        .status(200)
        .json({ message: "User saved successfully", data: modifiedDoc });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while saving the user" });
  }
});
router.post("/a", (req, res) => {
  const b =
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries";
  productModel
    .updateMany({}, { $set: { description: b } })
    .then((result) => {
      res.send(result);
      console.log(`${result.nModified} documents updated.`);
    })
    .catch((error) => {
      console.error(error);
    });
});
router.get("/category", (req, res) => {
  productModel
    .aggregate([
      {
        $group: {
          _id: "$category",
          _name: { $first: "$name" },
          images: { $first: "$images" },
          id: { $first: "$_id" },
        },
      },
    ])
    .then((result) => {
      const categorys = result.map((category, i) => ({
        category: category._id,
        image: category.images,
        name: category._name,
        id: category.id,
      }));
      res.status(200).send(categorys);
    })
    .catch((error) => {
      res.status(500).send(error.message);
    });
});
router.get("/category/product", async (req, res) => {
  const category = req.query.category;
  try {
    const product = await productModel.find({ category: category });
    const promise = product.map(async (product, i) => {
      const sold = await fetchSoldNumber(product._id);

      return {
        sold: sold,
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        images: product.images,
        price: product.price,
        salesPrice: product.salesPrice,
        id: product._id,
        deliveryCharge: product.deliveryCharge,
        tag: product.tag,
      };
    });
    const products = await Promise.all(promise);
    res.status(200).json(products);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get("/category/product/sort", async (req, res) => {
  try {
    const { price, sold, freeDelivery, category } = req.query;
    let sortQuery = {};

    if (price === "asc") {
      sortQuery.salesPrice = 1;
    } else if (price === "desc") {
      sortQuery.salesPrice = -1;
    }
    console.log(sortQuery);
    console.log(req.query);
    let product;
    if (category === "all") {
      product = await productModel.find({}).sort({ salesPrice: 1 }).limit(10);
    } else if (freeDelivery != null) {
      product = await productModel
        .find({ $and: [{ deliveryCharge: 0 }, { category: category }] })
        .limit(10);
    } else if (sold === "asc") {
      product = await productModel.find({ category: category }).limit(10);
    } else {
      product = await productModel
        .find({ category: category })
        .sort(sortQuery)
        .limit(12);
    }
    console.log(product);
    const promise = product.map(async (product, i) => {
      const sold = await fetchSoldNumber(product._id);

      return {
        sold: sold,
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        images: product.images,
        price: product.price,
        salesPrice: product.salesPrice,
        id: product._id,
      };
    });
    const products = await Promise.all(promise);
    let sortedProducts;
    if (sold === "asc") {
      console.log("Sorting products");
      sortedProducts = products.sort((a, b) => b.sold - a.sold);
    } else {
      sortedProducts = products;
    }
    res.status(200).json(sortedProducts);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

async function fetchSoldNumber(productId) {
  try {
    const sold = await soldModel.find({ productId: productId });
    return sold[0].sold;
  } catch (error) {
    console.error(error);
    return [];
  }
}
async function fetchUser(userId) {
  try {
    const sold = await userModel.find({ _id: userId });
    return sold;
  } catch (error) {
    console.error(error);
    return [];
  }
}
async function fetchShopName(shopId) {
  try {
    const shop = await shopModel.find({ _id: shopId });
    return shop;
  } catch (error) {
    console.error(error);
    return [];
  }
}
router.get("/sold", (req, res) => {
  productModel.find({}).then((products) => {
    let result = [];
    products.forEach((product) => {
      result.push({
        sold: Math.floor(Math.random() * 90) + 10,
        productId: product._id,
      });
    });
    res.send(result);
  });
});
router.get("/product", async (req, res) => {
  const productId = req.query.productId;
  try {
    const product = await productModel
      .findById(productId)
      .populate("shopId")
      .populate("reviewId")
      .populate("questionId");
    const reviewPromises =
      product.reviewId?.review?.map(async (element) => {
        const user = await fetchUser(element.userId);
        return {
          ...element._doc,
          user: user,
        };
      }) ?? [];

    const questionPromises =
      product.questionId?.questionAnswer?.map(async (element) => {
        const user = await fetchUser(element.userId);
        return {
          ...element._doc,
          user: user,
        };
      }) ?? [];
    const sameStoreProduct = await productModel
      .find({
        shopId: product.shopId._id,
        $or: [
          { tag: { $in: product.tag } },
          { category: product.category },
          { subCategory: product.subCategory },
        ],
      })
      .populate("reviewId")
      .limit(6);
    const recomonded = await productModel
      .find({
        $or: [
          { tag: { $in: product.tag } },
          { category: product.category },
          { subCategory: product.subCategory },
        ],
      })
      .limit(6);
    // console.log(recomonded)
    const promise = recomonded.map(async (product) => {
      const sold = await fetchSoldNumber(product._id);
      return {
        id: product._id,
        name: product.name,
        images: product.images,
        category: product.category,
        salesPrice: product.salesPrice,
        price: product.price,
        sold: sold,
        subCategory: product.subCategory,
      };
    });
    const promise1 = sameStoreProduct.map(async (product) => {
      const sold = await fetchSoldNumber(product._id);
      return {
        id: product._id,
        name: product.name,
        images: product.images,
        category: product.category,
        salesPrice: product.salesPrice,
        price: product.price,
        sold: sold,
        subCategory: product.subCategory,
      };
    });

    let recomondedProduct = await Promise.all(promise);
    let fromSameStore = await Promise.all(promise1);

    if (!product) {
      return res.status(404).send("Product not found");
    }
    const fetchSold = await fetchSoldNumber(product._id);
    delete product.reviewId;
    delete product.questionId;
    const result = [
      {
        ...product._doc,
        questionId: await Promise.all(questionPromises),
        reviewId: await Promise.all(reviewPromises),
        // description:product.description,
        sold: fetchSold,
        recomonded: recomondedProduct,
        fromSameStore: fromSameStore,
      },
    ];
    console.log(result);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
});
router.post("/product/order", async (req, res) => {
  try {
    const { userId, shopId, deliveryAddress, data } = req.body;
    console.log(req.body);
    const orderData = JSON.parse(data).map((entry) => {
      const shopId = Object.keys(entry)[0];
      const productIds = entry[shopId];

      return {
        shopId: mongoose.Types.ObjectId.isValid(shopId)
          ? new mongoose.Types.ObjectId(shopId)
          : null,
        productId: productIds.map((productId) =>
          mongoose.Types.ObjectId.isValid(productId)
            ? new mongoose.Types.ObjectId(productId)
            : null
        ),
      };
    });

    const nonEmptyOrderData = orderData.filter(
      (order) => order.shopId !== null && order.productId.length > 0
    );

    console.log(orderData);
    const order = new orderModel({
      userId: userId,
      orderData: nonEmptyOrderData,
      deliveryAddress: deliveryAddress,
    });
    await order.save();
    const result = await orderModel.find({});
    const myOrder = result[result.length - 1];
    console.log("myorder", myOrder);
    res.status(200).send({ mssage: "success", id: myOrder._id });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});
router.post("/product/question", async (req, res) => {
  const { userId, shopId, productId, question } = req.body;

  questionModel
    .findOne({ shopId: shopId, productId: productId })
    .then(async (result) => {
      console.log(result);
      if (result) {
        result.questionAnswer.push({
          question: question,
          userId: userId,
        });
        await result.save(); // Save the updated document after pushing into the array
      } else {
        const q = new questionModel({
          productId: productId,
          shopId: shopId,
          questionAnswer: [
            {
              userId: userId,
              question: question,
            },
          ],
        });
        await q.save();
      }
      res.status(200).send({ message: "success" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
});
router.get("/product/discover", async (req, res) => {
  try {
    const products = await productModel.find({}).limit(20);
    const promise = products.map(async (product) => {
      const sold = await fetchSoldNumber(product._id);
      return {
        sold: sold,
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        images: product.images,
        price: product.price,
        salesPrice: product.salesPrice,
        id: product._id,
      };
    });
    const product = await Promise.all(promise);
    const result = product.sort((a, b) => b.sold - a.sold);
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
router.post("/product/review", (req, res) => {
  const { review, rating, userId, productId } = req.body;
  console.log(req.body);
  reviewModel
    .find({ productId: productId })
    .then(async (result) => {
      if (result.length > 0) {
        console.log(result[0].review);
        result[0].review.push({
          rating: rating,
          userId: userId,
          review: review,
        });
        await result[0].save();
      } else {
        const r = new reviewModel({
          review: [
            {
              review: review,
              rating: rating,
              userId: userId,
            },
          ],
          productId: productId,
        });
        await r.save();
      }
      res.status(200).send({ message: "success" });
    })
    .catch((e) => {
      res.status(500).send({ message: e.message });
    });
});
router.get("/product/recomondation", async (req, res) => {
  const { category, subcategory, tags } = req.query;
  console.log(req.query);

  const finalCategory =
    category && category.includes(",") ? category.split(",") : [category];

  const finalSubCategory =
    subcategory && subcategory.includes(",")
      ? subcategory.split(",")
      : [subcategory];

  const finalTag =
    tags && tags.includes(",") ? tags.slice(1, -1).split(",") : [];

  // console.log(finalCategory);
  // console.log(finalSubCategory);
  // console.log(finalTag);

  try {
    const product = await productModel
      .find({
        $or: [
          { category: { $in: finalCategory } },
          { subCategory: { $in: finalSubCategory } },
          { tag: { $in: finalTag } },
        ],
      })
      .limit(20);
    const promise = product.map(async (product, i) => {
      const sold = await fetchSoldNumber(product._id);

      return {
        sold: sold,
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        images: product.images,
        price: product.price,
        salesPrice: product.salesPrice,
        id: product._id,
        deliveryCharge: product.deliveryCharge,
        tag: product.tag,
      };
    });
    const myData = await Promise.all(promise);
    res.status(200).send(myData);
    console.log("test");
  } catch (err) {
    res.statusCode(200).send({ message: err.mssage });
  }
});

router.get("/shop/product", async (req, res) => {
  const shopId = "64b0159e3e411d8601ad82a8";
  const page = req.query.page || 0;
  const itemPerPage = 10;
  const skip = page * itemPerPage;
  try {
    const product = await productModel.find({}).skip(skip).limit(itemPerPage);
    const shop = await fetchShopName(shopId);
    const promise = product.map(async (product, i) => {
      const sold = await fetchSoldNumber(product._id);
      console.log(product.instock);
      return {
        color: product.color,
        varient: product.varient,
        sold: sold,
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        images: product.images,
        price: product.price,
        salesPrice: product.salesPrice,
        id: product._id,
        deliveryCharge: product.deliveryCharge,
        tag: product.tag,
        stock: product.instock,
      };
    });
    const products = await Promise.all(promise);
    console.log(shop);
    res.render("products", { products, shop: shop });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.post("/shop/product", (req, res) => {
  const {
    id,
    category,
    subCategory,
    name,
    deliveryCharge,
    color,
    varient,
    instock,
    tag,
    image,
  } = req.body;
  productModel
    .updateOne({ _id: id }, { $set: { images: image } })
    .then((result) => {
      console.log(result);
      res.send(result);
      console.log(`${result.nModified} documents updated.`);
    })
    .catch((error) => {
      console.error(error);
    });
});
router.post("/shop/product/add", (req, res) => {
  console.log(req.body);
  res.send("success");
});
router.get("/shop/product/add", (req, res) => {
  res.render("new_product");
});
router.get("/admin/login", (req, res) => {
  res.render("login");
});
router.post("/shop/register", async (req, res) => {
  try {
    const { name, image, location, phone } = req.body;
    const shop = new shopModel({
      name: name,
      image: image,
      location: location,
      phone: phone,
    });
    await shop.save();
    console.log(req.body);
    res.status(200).send({ message: "success" });
  } catch (e) {
    res.status(500).send({ message: "error" });
  }
});
router.get("/shop/register", (req, res) => {
  res.render("register_shop");
});
router.post("/shop/login", (req, res) => {
  const { phone } = req.body;
  console.log(phone);
  shopModel
    .find({ phone: phone })
    .then((shop) => {
      res.status(200).send(shop);
    })
    .catch((err) => {
      res.status(200).send(err.message);
    });
});
router.get("/shop/login", (req, res) => {
  res.render("login_shop");
});
router.get("/dashboard", async (req, res) => {
  try {
    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "days").startOf("day");
    const currentDate = moment();

    const lastYearSellArray = [];
    const lastSevenDaysSellArray = [];

    let todayData = await soldModel
      .find({ createdAt: { $gte: today } })
      .then((result) => {
        return result.reduce((acc, item) => acc + item.sold, 0);
      });
    let yesterdaydata = await soldModel
      .find({ createdAt: { $gte: yesterday, $lt: today } })
      .then((result) => {
        return result.reduce((acc, item) => acc + item.sold, 0);
      });
    for (let i = 0; i < 12; i++) {
      const startDate = moment()
        .subtract(i + 1, "months")
        .startOf("month");
      const endDate = moment().subtract(i, "months").startOf("month");

      const monthData = await soldModel.find({
        createdAt: { $gte: startDate, $lt: endDate },
      });

      const totalSold = monthData.reduce((acc, item) => acc + item.sold, 0);
      console.log(monthData);
      lastYearSellArray.unshift(totalSold);
    }

    for (let i = 0; i < 7; i++) {
      const startDate = currentDate.clone().subtract(i, "days").startOf("day");
      const endDate = currentDate
        .clone()
        .subtract(i - 1, "days")
        .startOf("day");
      console.log(startDate, endDate);
      const dayData = await soldModel.find({
        createdAt: { $gte: startDate, $lt: endDate },
      });

      const totalSold = dayData.reduce((acc, item) => acc + item.sold, 0);
      lastSevenDaysSellArray.unshift(totalSold);
    }
    console.log(yesterdaydata);
    res.render("dashbord", {
      lastYearSellArray,
      lastSevenDaysSellArray,
      todayData,
      yesterdaydata,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.render("error", { error });
  }
});

router.get("/product/review", async (req, res) => {
  try {
    const shopId = req.query.shop;
    const page = req.query.page || 0;
    const itemPerPage = 10;
    console.log(shopId);
    const questions = await reviewModel
      .find({})
      .skip(page * itemPerPage)
      .limit(itemPerPage);
    const questionPromises = questions.map(async (questionDocument) => {
      // Accessing the questionAnswer property within each document
      const questionAnswer = questionDocument.review;
      const product = await fetchProduct(questionDocument.productId);
      const userPromises = questionAnswer.map(async (q) => {
        const user = await fetchUser(q.userId);

        return {
          review: q.review,
          rating: q.rating,
          user: user,
          product: product,
        };
      });
      const users = await Promise.all(userPromises);
      return users;
    });

    const result = await Promise.all(questionPromises);

    res.render("review", { result: result });
  } catch (err) {
    console.log(err);
  }
});
router.get("/product/question", async (req, res) => {
  try {
    const shopId = req.query.shop;
    const page = req.query.page || 0;
    const itemPerPage = 10;
    console.log(shopId);
    const questions = await questionModel
      .find({})
      .skip(page * itemPerPage)
      .limit(itemPerPage);
    const questionPromises = questions.map(async (questionDocument) => {
      // Accessing the questionAnswer property within each document
      const questionAnswer = questionDocument.questionAnswer;
      const product = await fetchProduct(questionDocument.productId);
      const userPromises = questionAnswer.map(async (q) => {
        const user = await fetchUser(q.userId);

        return {
          id: q._id,
          question: q.question,
          answer: q.answer,
          user: user,
          product: product,
          questionDate: q.questionDate,
        };
      });
      const users = await Promise.all(userPromises);
      return users;
    });

    const result = await Promise.all(questionPromises);
    console.log(result);
    res.render("question", { result: result });
  } catch (err) {
    console.log(err);
  }
});
router.post("/product/question/answer", async (req, res) => {
  console.log(req.body);
  const questionId = "64b17949f63a036e2b420f82";
  const questionObjectId = "64c77878d6fc802d2e87c86b";

  try {
    const question = await questionModel.findById(questionId);

    if (question) {
      question.questionAnswer.forEach(async (item) => {
        if (item._id.toString() === questionObjectId) {
          item.answer = " newAnswer";
        }
      });
      await question.save();

      res.send("Answer updated successfully");
    } else {
      res.status(404).send({ message: "Requested question is not found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Error updating answer" });
  }

  res.send("success");
});
router.get("/product/question/answer", (req, res) => {
  res.render("answer");
});
router.get("/message/post", async (req, res) => {
  const shopId = req.query.shopId;
  let page = req.query.page || 0;
  const itemPerPage = req.query.limit || 5;

  const messages = await userMessageModel
    .find({ shopId: shopId })
    .skip(page * itemPerPage)
    .sort({ "messages.at": -1 })
    .limit(itemPerPage);

  res.render("message", { myMessage: messages });
});
router.get("/orders/get", async (req, res) => {
  const shopId = "64b0159e3e411d8601ad82a8"; // Replace this with the desired shopId
  const myorders = [];
  const page = req.query.page || 0;
  const itemsPerPage = req.query.itemsPerPage || 10;
  try {
    const orders = await orderModel
      .find({ "orderData.shopId": shopId })
      .skip(page * itemsPerPage)
      .limit(itemsPerPage)
      .populate({
        path: "orderData.productId",
        model: "product",
      })
      .populate("userId");

    if (orders.length > 0) {
      orders.forEach((order) => {
        const deliveryAddress = order.deliveryAddress;
        const orderStatus = order.orderStatus;
        const id = order._id;
        const user = order.userId;
        const products = order.orderData.map((data) =>
          data.productId.map((product) => ({
            name: product.name,
            images: product.images,
            _id: product._id,
          }))
        );
        myorders.push({
          user: user,
          id: id,
          address: deliveryAddress,
          orderStatus: orderStatus,
          product: products,
        });
      });
      console.log(myorders);
    } else {
      console.log("No orders found", { order: myorders });
    }
  } catch (e) {
    console.log(e);
  }

  res.render("orders", { order: myorders });
});

async function fetchProduct(productId) {
  try {
    const product = await productModel
      .find({ _id: productId })
      .select("_id name images");
    return product;
  } catch (error) {
    console.error(error);
    return [];
  }
}

var sendNotification = function (data) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: "Basic " + oneSignalConff.apiKey,
  };
  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers,
  };

  var https = require("https");
  var req = https.request(options, function (res) {
    res.on("data", function (data) {
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });

  req.on("error", function (e) {
    console.log("ERROR:");
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

router.get("/sendnotification", async (req, res) => {
  var message = {
    app_id: oneSignalConff.appId,
    contents: { en: "demo message" },
    included_segments: ["All"],
    content_available: true,
    small_icon: "ic_notification_icon",
  };
  sendNotification(message);
  res.send("success");
});

router.post("/sendNotificationToDevice", async (req, res) => {
  console.log("reqbody", req.body.devices);

  let message = {
    app_id: oneSignalConff.appId,
    contents: { en: "testing push notification to specific device" },
    included_segments: ["included_player_ids"],
    include_player_ids: req.body.devices, // Assuming this contains valid OneSignal device IDs
    content_available: true,
    small_icon: "ic_notification_icon",
    data: {
      PushTitle: "CUSTOM NOTIFICATION",
    },
  };

  sendNotification(message, (err, result) => {
    if (err) {
      res.status(500).send({ err: err });
    } else {
      res.status(200).send({
        message: "success",
        data: result,
      });
    }
  });
});
router.post("/message", async (req, res) => {
  try {
    const { title, description } = req.body;
    const message = new messageModel({
      title: title,
      description: description,
    });
    await message.save();
    res.send("success");
  } catch (err) {
    res.status(500).send({ message: "Error" + err });
  }
});
router.get("/message", (req, res) => {
  messageModel.find({}).then((message) => {
    res.status(200).send(message);
  });
});
router.get("/product/search", async (req, res) => {
  const key = req.query.q;

  try {
    if (key != "") {
      const product = await productModel.find({
        $or: [
          { name: { $regex: key } },
          { category: { $regex: key } },
          { subCategory: { $regex: key } },
          { tag: { $regex: key } },
        ],
      });
      const promise = product.map(async (product, i) => {
        const sold = await fetchSoldNumber(product._id);

        return {
          color: product.color,
          varient: product.varient,
          sold: sold,
          name: product.name,
          category: product.category,
          subCategory: product.subCategory,
          images: product.images,
          price: product.price,
          salesPrice: product.salesPrice,
          id: product._id,
          deliveryCharge: product.deliveryCharge,
          tag: product.tag,
          stock: product.instock,
        };
      });
      const products = await Promise.all(promise);
      res.status(200).json(products);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get("/product/for-you", async (req, res) => {
  try {
    const product = await productModel
      .find({})
      .sort({ salesPrice: 1 })
      .limit(20);
    const promise = product.map(async (product, i) => {
      const sold = await fetchSoldNumber(product._id);

      return {
        sold: sold,
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        images: product.images,
        price: product.price,
        salesPrice: product.salesPrice,
        id: product._id,
        deliveryCharge: product.deliveryCharge,
        tag: product.tag,
      };
    });
    const products = await Promise.all(promise);
    res.status(200).json(products);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.post("/message-to/shop", async (req, res) => {
  try {
    const { message, shopId, userId, isSender } = req.body;
    const previousMessage = await userMessageModel.findOne({
      $and: [{ shopId: shopId }, { userId: userId }],
    });

    if (previousMessage) {
      previousMessage.messages.push({
        message: message,
        isSender: isSender,
      });
      await previousMessage.save();
    } else {
      const userMessage = new userMessageModel({
        userId: userId,
        shopId: shopId,
        messages: [
          {
            isSender: isSender,
            message: message,
          },
        ],
      });
      await userMessage.save();
    }

    res.status(200).send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: e.message });
  }
});

router.get("/message-to/shop", async (req, res) => {
  const { shopId, userId } = req.query;
  try {
    await userMessageModel
      .findOne({ $and: [{ shopId: shopId, userId: userId }] })
      .then((result) => {
        res.status(200).send(result.messages);
      })
      .catch((err) => {
        res.status(404).send({ message: "no message yet" + err.message });
      });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});
router.post("/order/status", (req, res) => {
  const { id, status } = req.body;
  console.log(id);
  try {
    orderModel
      .findById(id)
      .then((result) => {
        if (result) {
          orderModel
            .updateOne({ _id: id }, { $set: { orderStatus: status } })
            .then((doc) => {
              console.log(doc);
              res.status(200).send("success");
            })
            .catch((e) => {
              console.log(e);
              res.status(500).send("Update failed");
            });
        } else {
          res.status(404).send("Order not found");
        }
      })
      .catch((e) => {
        console.log(e);
        res.status(404).send({ message: "No orders found" + e.message });
      });
  } catch (e) {
    res.status(500).send({ message: "Error" + e.message });
  }
});
router.get("/get-order", async (req, res) => {
  const userId = req.query.userId;
  const orders = await orderModel
    .find({ userId: userId })
    .then((order) => {
      if (order.length > 0) res.status(200).send(order);
      else {
        res.status(404).send({ message: "no orders found" });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
});
router.get("/shops", (req, res) => {
  shopModel.find({}).then((shop) => {
    res.render("shops", { shop: shop });
  });
});
router.get("/message/to-shop", (req, res) => {
  const shopId=req.query.shopId;
  messageToShopModel.find({$or:[{shopId: shopId},{audiance:'all'}]}).sort({createdAt:-1}).then((response)=>{
    res.render("messageToShop",{messsage:response});
  }).catch(err => {
    console.error(err);
  })
  
});
router.post("/message/to-shop", async (req, res) => {
  try {
    const { message,audiance } = req.body;
    console.log(req.body);
    const shopId = req.query.shopId;
    const messageToShop = new messageToShopModel({
      message: message,
      shopId: shopId,
      audiance:audiance
    });
    await messageToShop.save();
    res.status(200).send({ message: "success" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
module.exports = router;
