require('dotenv').config()
const bcrypt = require('bcrypt')

const saltRounds = parseInt(`${process.env.SALT_ROUNDS}`)
async function hashPassword(password) { // updated
    const salt = await bcrypt.genSalt(saltRounds)
    const hash = await bcrypt.hash(password, salt)
    return hash
}

const compareHashes = (hash1, hash2) => 
    bcrypt.compare(hash1, hash2)



module.exports = {
    hashPassword,
    compareHashes 
}


