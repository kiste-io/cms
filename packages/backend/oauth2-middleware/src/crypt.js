const bcrypt = require('bcrypt')

const salt = '$2b$10$CNcoMhE3EBV3gAcX5MWXHO'
async function hashPassword(password) { // updated
    const hash = await bcrypt.hash(password, salt)
    return hash
}

module.exports = {
    hashPassword
}

hashPassword('test').then((res) => console.log(res));
