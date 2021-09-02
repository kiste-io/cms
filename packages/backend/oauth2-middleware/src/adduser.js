#!/usr/bin/env node

const connector = require('@kiste/backend-mongo-connector')
require('dotenv').config()


const [, , user, password_hash] = process.argv;

const mongoURI = `${process.env.MONGO_URI}`;

// Database Name
const dbName = `${process.env.MONGO_DB_NAME}`;
const connection = connector(mongoURI, dbName)


function addUser (user, password_hash) {
    return new Promise((resolve, reject) => connection((db) => db
    .collection('users')
    .insertOne({user, password_hash}).then(resolve).catch(reject)))

}


addUser(user, password_hash).then((res) => console.log(res.result))