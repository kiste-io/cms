const {comparePassword} = require('./crypt')

module.exports = (connection) => ({

    getAccessToken: async function(accessToken) {
        const token = await new Promise((resolve, reject) => connection((db) => db
        .collection('tokens')
        .findOne({
            accessToken
        }, (err, result) => {
            console.error(err)
            resolve(result)
        })))

        return token
    },

    getRefreshToken: async function(refreshToken) {
        const token = await new Promise((resolve, reject) => connection((db) => db
        .collection('tokens')
        .findOne({
            refreshToken
        }, (err, result) => {
            console.error(err)
            resolve(result)
        })))

        return token
    },
  
    revokeToken: async function({refreshToken}) {
        const token = await new Promise((resolve, reject) => connection((db) => db
        .collection('tokens')
        .deleteOne({
            refreshToken
        }, (err, result) => {
            if(err){
                console.error(err)
                reject(err)
                return
            }
            
            resolve(result)
        })))
        return token
    },


    getClient: (id, secret) => {
        return {
            id,
            secret,
            grants: ['password', 'refresh_token'],
            redirectUris: null,
        }
    },
  
    getUser: async function(username, password) {
        
        const user = await new Promise((resolve, reject) => connection((db) => db
        .collection('users')
        .findOne({
            username
        }, (err, result) => {
            console.error(err)
            resolve(result)
        })).catch((e) => reject(e)))

        if(user.password_hash && await comparePassword(password, user.password_hash)) {
            return user
        }
        return null
    },

    
    saveToken: async function(token, client, user) {

        token.client = {
            id: client.id
        };

        token.user = {
            username: user.username
        };
        
        await new Promise((resolve, reject) => connection((db) => {
            db.collection('tokens').insertOne(token).then(resolve).catch(reject)
        }))

        return token;
    }

    
  });