require('dotenv').config()
const bcrypt = require('bcrypt')

const saltRounds = parseInt(`${process.env.SALT_ROUNDS}`)
async function hashPassword(password) { 
    const salt = await bcrypt.genSalt(saltRounds)
    const hash = await bcrypt.hash(password, salt)
    return {hash, salt}
}



async function comparePassword(password, hash) { 
   
    return await bcrypt.compare(password, hash)
    
}



module.exports = {
    hashPassword,
    comparePassword 
}


