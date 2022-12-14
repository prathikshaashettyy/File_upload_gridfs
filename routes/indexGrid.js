var express = require("express");
const mongoose = require('mongoose');
var multer = require("multer");
var path = require("path");
var jwt = require("jsonwebtoken");
var empModel = require("../modules/employee");
const { readdir } = require("node:fs/promises");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
var router = express.Router();
var employee = empModel.find({});
const crypto = require("crypto");

var imgName="";
var flag;

const mongoURI = "mongodb://localhost:27017/employee";
const conn = mongoose.createConnection(mongoURI);
let gfs;
conn.once("open", () => {gfs = Grid(conn.db, mongoose.mongo); gfs.collection("employee")});

router.use(express.static(__dirname + "./public/"));

const storage = new GridFsStorage({
  url: mongoURI,
  file: function (req, file) {
      return new Promise((resolve, reject) => {
          crypto.randomBytes(16, (err, buf) => {
              if (err) {
                  return reject(err);
              }
              const fileInfo = {
                  filename: file.originalname,
                  bucketName: "employee",
              };
              resolve(fileInfo);
          });
      });
  }
})

var upload = multer({
  fileFilter: async function (req, file, cb) {
    console.log(file.originalname);
    imgName = file.originalname;
    gfs.files.find({ filename: file.originalname })
        .toArray((err, files) => {
          console.log(files ,"type",typeof files , files.length);
            if (files.length > 0) 
            {
              req.fileValidationError = `File Already Exists`;
                cb(null, false, req.fileValidationError);
            }
             else               
              cb(null, true ,req.body.typeOfFile);
             })
  },storage
}).single("file");


router.get("/", function (req, res, next) {
  employee.exec(function (err, data) {
    if (err) throw err;
    res.render("index", {
      title: "Image Records",
      records: data,
      error: "",
      success:""
    });
  });
});

router.post("/", upload, async function (req, res, next) {

  if (req.fileValidationError) {
    employee.exec(function (err, data) {
      if (err) throw err;
      res.render("index", {
        title: "Image Records",
        records: data,
        error: "Image Already Exist",
        success:""
      });
    });
  } else {
    var empDetails = new empModel({
      name: req.body.uname,
      email: req.body.email,
      image: imgName,
    });
    empDetails.save(function (err, req1) {
      if (err) throw err;
      employee.exec(function (err, data) {
        if (err) throw err;
        res.render("index", {
          title: "Image Records",
          records: data,
          success: "Image Uploaded Successfully",
          error:""
        });
      });
    });
  }
});

module.exports = router;
