// // models/Image.js
// const mongoose = require('mongoose');

// const imageSchema = mongoose.Schema(
//   {
//     public_id: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     secure_url: { // This is the field that was causing the validation error
//       type: String,
//       required: true,
//     },
//     url: { // Often the same as secure_url; keep if needed, otherwise remove
//       type: String,
//       // required: true, // You might make this optional if secure_url is the primary one
//     },
//     original_filename: {
//       type: String,
//       required: true,
//     },
//     format: {
//       type: String,
//     },
//     width: { // Make these optional if multer-storage-cloudinary doesn't provide them
//       type: Number,
//     },
//     height: { // Make these optional if multer-storage-cloudinary doesn't provide them
//       type: Number,
//     },
//     bytes: {
//       type: Number,
//     },
//     title: {
//       type: String,
//       default: 'Untitled Image',
//     },
//     description: {
//       type: String,
//       default: '',
//     },
//     tags: [
//       {
//         type: String,
//       },
//     ],
//   },
//   {
//     timestamps: true, // Adds `createdAt` and `updatedAt`
//   }
// );

// module.exports = mongoose.model('Image', imageSchema);