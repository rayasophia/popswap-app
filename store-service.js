const Sequelize = require('sequelize');
const pg = require('pg');

var sequelize = new Sequelize('senecadb', 'senecadb_owner', 'f3zaYKxHcR8F', {
    host: 'ep-super-heart-a5ysxwck.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    itemDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
  });

const Category = sequelize.define('Category', {
    category: Sequelize.STRING
  });

Item.belongsTo(Category, {foreignKey: 'category'});

function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
        .then(() => {
          resolve("Synced successfully.");
        })
        .catch((err) => {
          reject("Unable to sync the database.");
        });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        Item.findAll()
        .then((items) => {
          if (items.length > 0) {
            resolve(items);
          } else {
            reject("No results returned.");
          }
        })
        .catch((err) => {
          reject("No results returned.");
        });
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
              published: true
            }
          })
        .then((items) => {
          if (items.length > 0) {
            resolve(items);
          } else {
            reject("No results returned.");
          }
        })
        .catch((err) => {
          reject("No results returned.");
        });
    });
}

function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
              category: category,
              published: true
            }
          })
        .then((items) => {
          if (items.length > 0) {
            resolve(items);
          } else {
            reject("No results returned.");
          }
        })
        .catch((err) => {
          reject("No results returned.");
        });
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        Category.findAll()
        .then((categories) => {
          if (categories.length > 0) {
            resolve(categories);
          } else {
            reject("No results returned.");
          }
        })
        .catch((err) => {
          reject("No results returned.");
        });
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
              category: category
            }
          })
        .then((items) => {
          if (items.length > 0) {
            resolve(items);
          } else {
            reject("No results returned.");
          }
        })
        .catch((err) => {
          reject("No results returned.");
        });
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;
        Item.findAll({
            where: {
              itemDate: {
                [gte]: new Date(minDateStr)
              }
            }
          })
        .then((items) => {
          if (items.length > 0) {
            resolve(items);
          } else {
            reject("No results returned.");
          }
        })
        .catch((err) => {
          reject("No results returned.");
        });
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
              id: id
            }
          })
        .then((items) => {
          if (items.length > 0) {
            resolve(items[0]);
          } else {
            reject("No results returned.");
          }
        })
        .catch((err) => {
          reject("No results returned.");
        });
    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = (itemData.published) ? true : false;
        for (let property in itemData) {
            if(itemData[property] == "") {
                itemData[property] = null;
            }
        }
        itemData.itemDate = new Date();
        Item.create(itemData)
        .then(() => {
            resolve("Item created successfully.");
        })
        .catch((err) => {
            reject("Unable to create item.");
        })
    });
}

function addCategory(categoryData) {
    return new Promise((resolve,reject) => {
        for (let property in categoryData) {
            if (categoryData[property] == "") {
              categoryData[property] = null;
            }
        }
        Category.create(categoryData)
        .then(() => {
            resolve("Category created successfully.");
        })
        .catch((err) => {
            reject("Unable to create category.");
        })
    })
}

function deleteItemById(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: {
                id: id
            }
        })
        .then((deleted) => {
          if (deleted > 0) {
            resolve("Item deleted successfully.");
          } else {
            reject("No item found with the id.");
          }
        })
        .catch((err) => {
          reject("Unable to delete item.");
        });
    });
}

function deleteCategoryById(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {
                id: id
            }
        })
        .then((deleted) => {
          if (deleted > 0) {
            resolve("Category deleted successfully.");
          } else {
            reject("No category found with the id.");
          }
        })
        .catch((err) => {
          reject("Unable to delete category.");
        });
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getPublishedItemsByCategory,
    getCategories,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById,
    addItem,
    addCategory,
    deleteItemById,
    deleteCategoryById
};