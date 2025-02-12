const express = require("express");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const authData = require("./auth-service.js");
const clientSessions = require("client-sessions");
const storeService = require("./store-service.js");
const app = express();
const upload = multer();

cloudinary.config({
  cloud_name: "dj3xr2zcd",
  api_key: "463367722463778",
  api_secret: "vkczMaThfnPKoBTeSzscE82-4QY",
  secure: true,
});

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url === app.locals.activeRoute
            ? ' class="nav-link active" data-bs-toggle="tab" aria-selected="true" role="tab" '
            : ' class="nav-link" ') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      },
    },
  })
);

app.set("view engine", ".hbs");

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(
  clientSessions({
    cookieName: "session",
    secret: "sC3Mdhfr70ASjf21JKcm6845BSAsFGe5AMFjt54FMj34",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/items");
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  let viewData = {};
  try {
    let items = [];
    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      items = await storeService.getPublishedItems();
    }
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
    let item = items[0];
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "No results returned.";
  }
  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "No results returned.";
  }
  res.render("shop", { data: viewData });
});

app.get("/items", ensureLogin, (req, res) => {
  const category = req.query.category;
  const minDate = req.query.minDate;
  const renderItems = (items) => {
    if (items.length > 0) {
      res.render("items", { items });
    } else {
      res.render("items", { message: "No results returned." });
    }
  };
  if (category) {
    storeService
      .getItemsByCategory(category)
      .then(renderItems)
      .catch((err) => res.status(500).render("items", { message: err }));
  } else if (minDate) {
    storeService
      .getItemsByMinDate(minDate)
      .then(renderItems)
      .catch((err) => res.status(500).render("items", { message: err }));
  } else {
    storeService
      .getAllItems()
      .then(renderItems)
      .catch((err) => res.status(500).render("items", { message: err }));
  }
});

app.get("/shop/:id", async (req, res) => {
  let viewData = {};
  try {
    let items = [];
    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(
        req.query.category
      );
    } else {
      items = await storeService.getPublishedItems();
    }
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
    viewData.items = items;
  } catch (err) {
    viewData.message = "No results returned.";
  }
  try {
    viewData.item = await storeService.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "No results returned.";
  }
  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "No results returned.";
  }
  res.render("shop", { data: viewData });
});

app.get("/categories", ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render("categories", { categories });
      } else {
        res.render("categories", { message: "No results returned." });
      }
    })
    .catch((err) =>
      res.status(500).render("categories", { message: "No results returned." })
    );
});

app.get("/items/add", ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      res.render("addItem", { categories: data });
    })
    .catch((err) => {
      console.error("Error fetching categories:", err);
      res.render("addItem", { categories: [] });
    });
});

app.post(
  "/items/add",
  ensureLogin,
  upload.single("featureImage"),
  (req, res) => {
    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
      }

      upload(req)
        .then((uploaded) => {
          processItem(uploaded.url);
        })
        .catch((error) => {
          res.status(500).send({ error: error.message });
        });
    } else {
      processItem("");
    }

    function processItem(imageUrl) {
      req.body.featureImage = imageUrl;

      storeService
        .addItem(req.body)
        .then(() => {
          res.redirect("/items");
        })
        .catch((error) => {
          res.status(500).send({ error: error.message });
        });
    }
  }
);

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
  const categoryData = req.body;
  storeService
    .addCategory(categoryData)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to create category!");
    });
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  const id = req.params.id;
  storeService
    .deleteCategoryById(id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to remove category / category not found!");
    });
});

app.get("/items/delete/:id", ensureLogin, (req, res) => {
  const id = req.params.id;
  storeService
    .deleteItemById(id)
    .then(() => {
      res.redirect("/items");
    })
    .catch((err) => {
      res.status(500).send("Unable to remove item / item not found!");
    });
});

app.use((req, res) => {
  res.status(404).render("404");
});

const HTTP_PORT = process.env.PORT || 8080;
storeService
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Express http server listening on port ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Unable to start server: ${err}`);
  });

module.exports = app;
