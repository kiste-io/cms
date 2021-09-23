const express = require('express');
const router = new express.Router();

require('dotenv').config()


const {
    getPublishLog,
    buildProject
} = require('../src');


const publishRepo = (conn) => {

     // entity collections
     router.get("/publish", async (req, res) => {
   
        getPublishLog(conn)
            .then(r => res.send(r))
            .catch(() => res.status(500).send())      
        
    })



    router.post("/publish",  async (req, res) => {
       
        buildProject(conn)
            .then(() => res.send())
            .catch(() => res.status(500).send())
        
        
    })
    

    return router    
}




module.exports = {
    publishRepo
}
