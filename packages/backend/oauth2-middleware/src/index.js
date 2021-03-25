const oauth2 = require('oauth2-server')
const oauth2Model = require('./model')


const api = (router, connection) => {

    const oauth = new oauth2({
        model: oauth2Model(connection),
        debug: true,
        requireClientAuthentication: {password: false, refresh_token: false}
    });
    
    const reqres = (req, res) => 
        [new oauth2.Request(req), new oauth2.Response(res)]
            
    router.post("/oauth/token", async (req, res) => oauth.token(...reqres(req,res))
            .then(function({accessToken, accessTokenExpiresAt, scope, refreshToken, refreshTokenExpiresAt}) {            
                res.json({accessToken, accessTokenExpiresAt, scope, refreshToken, refreshTokenExpiresAt});
            }).catch(function(err) {
                res.status(err.code || 500).json(err);
            }))

    return {
        router,
        middleware: (req, res, next) => 
            oauth.authenticate(...reqres(req,res))
                .then(function() {
                    next();
                }).catch(function(err) {
                    res.status(err.code || 500).json(err);
                })

    }
    
}




module.exports = api
