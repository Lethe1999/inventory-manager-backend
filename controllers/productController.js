const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;


// Create Product
const createProduct = asyncHandler(async (req, res) => {
    const { name, sku, category, quantity, price, description } = req.body;

    // Validation
    if (!name || !category || !quantity || !price || !description) {
        res.status(400);
        throw new Error("Please fill up all fields");
    }

    // Handle Image upload
    let fileData = {};
    if (req.file) {
        // Save image to Cloudinary
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, { folder: "Inventory-Manager", resouce_type: "image" });
        } catch (error) {
            res.status(500);
            throw new Error("Image could not be uploaded");
        }

        // Save imageInfo to Database
        fileData = {
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 2),
        };
    }

    // Create Product
    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image: fileData,
    });
    // console.log(product);

    res.status(201).json(product);

});



// Get All Products
const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ user: req.user.id }).sort("-createdAt");
    res.status(200).json(products);
});



// Get Single Product
const getProduct = asyncHandler(async (req, res) => {
    // Find product
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Match user
    if (product.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error("User not authorized");
    }

    res.status(200).json(product);
});



// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
    // Find product
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Match user
    if (product.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error("User not authorized");
    }

    // Remove product
    await product.remove();

    // Try to also delete image in  cloudinary
    // const imageId = product.image.filePath.split("/").pop().split(".")[0];
    // await cloudinary.uploader.destroy("dkbyscoesg40bnyncem2", {type: 'upload'}, function (error, result) { console.log(result, error) });

    res.status(200).json({ message: "Product has been removed" });
});



// Update Product
const updateProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const { name, sku, category, quantity, price, description } = req.body;

    // Get original product
    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Match user
    if (product.user.toString() !== req.user.id) {
        res.status(400);
        throw new Error("User not authorized");
    }

    // Handle image upload
    let fileData = {};
    if (req.file) {
        let uploadedFile;
        // Save to cloudinary
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, { folder: "Inventory-Manager", resource_type: "image" });
        } catch (error) {
            res.status(500);
            throw new Error("Image could not be uploaded");
        }

        // Save to DB
        fileData = {
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 2),
        };
    }

    // Update product in DB
    const updatedProduct = await Product.findByIdAndUpdate(
        { _id: productId },
        {
            name: name || product.name,
            sku: sku || product.sku,
            category: category || product.category,
            quantity: quantity || product.quantity,
            price: price || product.price,
            description: description || product.description,
            image: Object.keys(fileData).length === 0 ? product?.image : fileData,
        },
        {
            new: true,
            runValidators: true,
        },
    );

    res.status(200).json(updatedProduct);
});




module.exports = {
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct,
};