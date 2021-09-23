require('dotenv').config()
const { exec } = require("child_process");


const buildPath = `${process.env.PUBLISH_BUILD_PATH}`;
const buildCMD = process.env.PUBLISH_BUILD_CMD;
const buildResult = process.env.PUBLISH_BUILD_RESULT_PATH;

const buildWebsite = () => new Promise((resolve, reject) => {

    const started  = Date.now()
    const cmd = `cd ${buildPath} && ${buildCMD}`
    console.log('publsh cmd', cmd)
    const child = exec(cmd);

    child.on('close', function (code, signal) {
        console.log(`code ${code} and signal ${signal}`);
                    
        resolve({
            started,
            finished: Date.now(),
            status: code === 0 ? 'success' : 'failed'
        })
    })

    child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
      });
      
    child.stderr.on('data', (data) => {
        console.error(`child stderr:\n${data}`);
    });
   
  

    
})

module.exports = {
    buildWebsite
}
