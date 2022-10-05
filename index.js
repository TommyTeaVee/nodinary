// Requiring module
const express = require("express");
const multer = require("multer");
const port = 3535;
const app = express();
const cloudinary = require("cloudinary").v2;
const bodyParser = require("body-parser");
const fs = require("fs");

// Creating uploads folder if not already present
// In "uploads" folder we will temporarily upload
// image before uploading to cloudinary
if (!fs.existsSync("./uploads")) {
	fs.mkdirSync("./uploads");
}

// Multer setup
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads");
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});

var upload = multer({ storage: storage });

// Body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/client"));
app.use("/uploads", express.static("uploads"));

// Cloudinary configuration
cloudinary.config({
	cloud_name: "dyahpxbaw",
	api_key: "949482623591665",
	api_secret: "yxNFXqc38ulRsLXIzW6m52yhSgY",
});

async function uploadToCloudinary(locaFilePath) {

	// locaFilePath: path of image which was just
	// uploaded to "uploads" folder

	var mainFolderName = "main";
	// filePathOnCloudinary: path of image we want
	// to set when it is uploaded to cloudinary
	var filePathOnCloudinary =
		mainFolderName + "/" + locaFilePath;

	return cloudinary.uploader
		.upload(locaFilePath, { public_id: filePathOnCloudinary })
		.then((result) => {

			// Image has been successfully uploaded on
			// cloudinary So we dont need local image
			// file anymore
			// Remove file from local uploads folder
			fs.unlinkSync(locaFilePath);

			return {
				message: "Success",
				url: result.url,
			};
		})
		.catch((error) => {

			// Remove file from local uploads folder
			fs.unlinkSync(locaFilePath);
			return { message: "Fail" };
		});
}

function buildSuccessMsg(urlList) {

	// Building success msg to display on screen
	var response = `<h1>
				<a href="/">Click to go to Home page</a><br>
				</h1><hr>`;

	// Iterating over urls of images and creating basic
	// html to render images on screen
	for (var i = 0; i < urlList.length; i++) {
		response += "File uploaded successfully.<br><br>";
		response += `FILE URL: <a href="${urlList[i]}">
					${urlList[i]}</a>.<br><br>`;
		response += `<img src="${urlList[i]}" /><br><hr>`;
	}

	response += `<br>
<p>Now you can store this url in database or
// do anything with it based on use case.</p>
`;
	return response;
}

app.post(
	"/profile-upload-single",
	upload.single("profile-file"),
	async (req, res, next) => {

		// req.file is the `profile-file` file
		// req.body will hold the text fields,
		// if there were any

		// req.file.path will have path of image
		// stored in uploads folder
		var locaFilePath = req.file.path;

		// Upload the local image to Cloudinary
		// and get image url as response
		var result = await uploadToCloudinary(locaFilePath);

		// Generate html to display images on web page.
		var response = buildSuccessMsg([result.url]);

		return res.send(response);
	}
);

app.post(
	"/profile-upload-multiple",
	upload.array("profile-files", 12),
	async (req, res, next) => {

		// req.files is array of `profile-files` files
		// req.body will contain the text fields,
		// if there were any
		var imageUrlList = [];

		for (var i = 0; i < req.files.length; i++) {
			var locaFilePath = req.files[i].path;

			// Upload the local image to Cloudinary
			// and get image url as response
			var result = await uploadToCloudinary(locaFilePath);
			imageUrlList.push(result.url);
		}

		var response = buildSuccessMsg(imageUrlList);

		return res.send(response);
	}
);

app.listen(port, () => {
	console.log(`Server running on port ${port}!
			\nClick http://localhost:3535/`);
});

