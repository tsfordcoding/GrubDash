const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

const list = (req, res) => {
    res.json({ data: dishes });
}

const priceIsValid = (req, res, next) => {
    const { data: { price } = {} } = req.body;

    if(Number.isInteger(price) && price > 0) {
        return next();
    }

    next({
        status: 400,
        message: `price`,
    });
}

const bodyHasData = (propertyName) => {
    return (req, res, next) => {
        const { data = {} } = req.body;

        if(data[propertyName]) {
            return next();
        }

        next({
            status: 400,
            message: `Must include a ${propertyName} property.`,
        });
    }
}

const create = (req, res) => {
    const { data: { name, description, price, image_url } = {} } = req.body;
    
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    };

    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

const dishExists = (req, res, next) => {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id.toString() === dishId);

    if(foundDish) {
        res.locals.dish = foundDish;
        return next();
    }

    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`,
    });
}

const read = (req, res) => {
    res.json({ data: res.locals.dish });
}

const dishIdIsValid = (req, res, next) => {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;

    if(!id || id === dishId) {
        res.locals.dishId = dishId;
        return next();
    }

    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
}

const update = (req, res) => {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
}

module.exports = {
    list,
    read: [dishExists, read],
    create: [
        bodyHasData("name"),
        bodyHasData("description"),
        bodyHasData("price"),
        bodyHasData("image_url"), 
        priceIsValid,
        create
    ],
    update: [
        dishExists,
        bodyHasData("name"),
        bodyHasData("description"),
        bodyHasData("price"),
        bodyHasData("image_url"),
        priceIsValid,
        dishIdIsValid,
        update
    ],
}