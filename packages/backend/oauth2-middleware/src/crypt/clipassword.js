#!/usr/bin/env node
const {hashPassword} = require('.')

const [, , password] = process.argv;

hashPassword(password).then((res) => console.log(res));
