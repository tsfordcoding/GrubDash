const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

const list = (req, res) => {
    res.json({ data: orders });
}

const quantityIsValid = (req, res, next) => {
    const { data: { dishes } = {} } = req.body;

    let message = "";
    dishes.forEach((dish, index) => {
        if(!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            message = `Dish ${index} must have a quantity that is an integer greater than 0`;
        }
    });

    if(!message) {
        return next(); 
    }

    next({
      status: 400,
      message: message,
    });
}

const dishesIsValid = (req, res, next) => {
    const { data: { dishes } = {} } = req.body;

    if (Array.isArray(dishes) && dishes.length > 0) {
      return next();
    }

    next({
        status: 400,
        message: `The 'dishes' property has to be an array containing at least 1 item.`
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
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }

    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

const orderExists = (req, res, next) => {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id.toString() === orderId);
    
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }

    next({
        status: 404,
        message: `Order does not exist: ${orderId}`,
    });
}

const read = (req, res) => {
    res.json({ data: res.locals.order });
}

const orderIdIsValid = (req, res, next) => {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;

    if(!id || id === orderId) {
        res.locals.orderId = orderId;
        return next();
    }

    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
}

const statusIsValid = (req, res, next) => {
    const { data: { status } = {} } = req.body;

    if (
      status === "pending" ||
      status === "preparing" ||
      status === "out-for-delivery"
    ) {
      return next();
    }

    next({
        status: 400,
        message: `status`,
    });
}

const update = (req, res) => {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

const deleteIsValid = (req, res, next) => {
    const { status } = res.locals.order;

    if(status === "pending") {
        return next();
    }

    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
}

const destroy = (req, res) => {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id.toString() === orderId);
    const deleteOrders = orders.splice(index, 1);
    res.sendStatus(204);
}
 
module.exports = {
    list,
    read: [orderExists, read],
    create: [
        bodyHasData("deliverTo"),
        bodyHasData("mobileNumber"),
        bodyHasData("dishes"),
        dishesIsValid,
        quantityIsValid,
        create,
    ],
    update: [
        orderExists,
        bodyHasData("deliverTo"),
        bodyHasData("mobileNumber"),
        bodyHasData("status"),
        bodyHasData("dishes"),
        dishesIsValid,
        quantityIsValid,
        orderIdIsValid,
        statusIsValid,
        update,
    ],
    delete: [
        orderExists,
        deleteIsValid,
        destroy,
    ],
}