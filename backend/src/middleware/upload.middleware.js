import multer from "multer";

const MB = 1024 * 1024;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * MB },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image uploads are allowed"));
  },
});

