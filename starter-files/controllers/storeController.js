const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true); //Null means that there are no errors
    } else {
      next({ message: "That file type isn't allowed!" }, false);
    }
  },
};

exports.homePage = (req, res) =>
  res.render('index', {
    name: req.name,
  });

exports.addStore = (req, res) =>
  res.render('editStore', {
    title: 'Add Store',
  });

exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) { //multer put the uploaded file to the file  property
    next(); //skip to next middleware
  } 
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`)
  //once wehave written the phototo our filesystem, keep going!
  next();
}

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review ?`);
  res.redirect(`stores/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  }).exec();
  console.log(store);
  req.flash(
    'success',
    `Successfully Updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}"> View Store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) return next();
  res.render('store', { store, title: store.name });
}