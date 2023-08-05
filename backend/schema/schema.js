const mongoose = require("mongoose");
const db = require("../db.js");
const userSchema = mongoose.Schema(
  {
    phone: {
      type: "string",
    },
    password: String,
    name: {
      type: "string",
    },
    image: String,
    email: {
      type: String,
    },
    address: String,
  },
  { timestamps: true }
);
const shopSchema = mongoose.Schema({
  image: String,
  name: String,
  location: String,
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  phone: String,
});
const productSchema = mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shop",
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "review",
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "question",
  },
  deliveryCharge: Number,
  name: String,
  category: String,
  subCategory: String,
  tag: [],
  price: Number,
  salesPrice: Number,
  description: String,
  hilights: [String],
  images: String,
  color: [],
  varient: [],
  brand: String,
  warenty: Boolean,
  capacity: Number,
  inStock: Number,
});
const reviewSchema = mongoose.Schema(
  {
    review: [
      {
        review: String,
        rating: Number,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
      },
    ],

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },
    image: [],
  },
  { timestamps: true }
);
const questionSchema = mongoose.Schema({
  questionAnswer: [
    {
      question: String,
      answer: String,
      questionDate: {
        default: Date.now(),
        type: Date,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    },
  ],
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shop",
  },
});
const orderSchema = mongoose.Schema(
  {
   
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    payment:String,
    orderData: [
      {
        productId: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
          },
        ],
        shopId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "shop",
        },
      },
    ],
    orderStatus: {
      type: String,
      default: "Pending",
    },

    deliveryAddress: String,
  },
  { timestamps: true }
);
const soldSchema = mongoose.Schema({
  productId: String,
  sold: Number,
},{timestamps: true});
const messageSchema = mongoose.Schema(
  {
    title: String,
    description: String,
  },
  { timestamps: true }
);
const userMessageSchema =mongoose.Schema({
shopId: String,
userId: String,
messages:[
  {
    message:String,
    queryProduct:String,
    isSender:{
      type:Boolean,
      default:true,
    },
    at:{
      type:Date,
      default:Date.now()
    }
  }
]
})
const messageToShop=mongoose.Schema({
  shopId:String,
  message:String,
  audiance:String
},{timestamps:true})
const userMessageModel=mongoose.model('userMessage',userMessageSchema)
const shopModel = mongoose.model("shop", shopSchema);
const userModel = mongoose.model("user", userSchema);
const productModel = mongoose.model("product", productSchema);
const reviewModel = mongoose.model("review", reviewSchema);
const questionModel = mongoose.model("question", questionSchema);
const orderModel = mongoose.model("order", orderSchema);
const soldModel = mongoose.model("sold", soldSchema);
const messageModel = mongoose.model("message", messageSchema);
const messageToShopModel=mongoose.model("messageToShop", messageToShop)
module.exports = {
  messageToShopModel,
  messageModel,
  shopModel,
  soldModel,
  userModel,
  productModel,
  reviewModel,
  questionModel,
  orderModel,
  userMessageModel
};
