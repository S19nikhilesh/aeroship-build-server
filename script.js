const { exec } = require("child_process")
const path = require('path')
const fs = require('fs')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const mime = require('mime-types')
const Redis =require('ioredis')


require('dotenv').config();

const publisher= new Redis(process.env.VARIABLE_NAME)


const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.ACCESS_ID,
        secretAccessKey: process.env.SECRET_KEY
    }
})

const PROJECT_ID = process.env.PROJECT_ID

function publishLog(log){
    publisher.publish(`logs:${PROJECT_ID}` ,JSON.stringify({log}))
}

async function init() {
    console.log('Executing script.js')
    publishLog("Build Started ....")
    const outDirPath = path.join(__dirname, 'output')

    const p = exec(`cd ${outDirPath} && npm install && npm run build`)

    p.stdout.on('data', function (data) {
        console.log(data.toString());
        publishLog(data.toString())
    })


    p.stderr.on('data', function (data) {
        console.log(data.toString());
        publishLog(`error: ${data.toString()}`)
    })

    p.on('close', async function () {
        console.log('Build Complete');
        publishLog("Build Complete");
        const distFolderPath = path.join(__dirname, 'output', 'dist')
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true })

        publishLog("Starting to upload")
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file);
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log("uploading... ", filePath)
            publishLog(`uploading ${filePath}`)


            const command = new PutObjectCommand({
                Bucket: 'vercel-aeroship',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            })

            await s3Client.send(command)
            publishLog(`uploaded ${file}`)
            console.log("uploaded... ", filePath)
        }
    })

    console.log("Done");
}


init();