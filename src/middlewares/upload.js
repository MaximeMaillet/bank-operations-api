const multer = require('multer');
const path = require('path');
const mkdirp = require('mkdirp');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `web/uploads/${req.user.id}`;
    mkdirp.sync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname  }-${  Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadCSV = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const authorizedExtensions = ['.csv'];
    const fileExtension = path.extname(file.originalname);
    if (authorizedExtensions.indexOf(fileExtension.toLowerCase()) === -1) {
      return cb(new Error(`Extension invalid. CSV are accepted : ${path.extname(file.originalname)} founded`));
    }

    cb(null, true);
  }
});

const uploadJSON = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const authorizedExtensions = ['.json'];
    const fileExtension = path.extname(file.originalname);
    if (authorizedExtensions.indexOf(fileExtension.toLowerCase()) === -1) {
      return cb(new Error(`Extension invalid. JSON are accepted : ${path.extname(file.originalname)} founded`));
    }

    cb(null, true);
  }
});

module.exports = {
  json: uploadJSON.single('json'),
  csv: uploadCSV.single('csv'),
};