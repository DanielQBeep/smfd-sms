const express = require('express')
const https = require('https')
const bodyParser = require('body-parser')
require('dotenv').config()

const app = express()
const port = 9876;

const smsGatewayUrl = {
    "protocol" : "https://",
    "hostname" : "www.isms.com.my",
    "path" : "/RESTAPI.php"
}
const username = process.env.SMS_GATEWAY_USERNAME
const password = process.env.SMS_GATEWAY_PASSWORD
const senderId = "Qbeep"

app.use(bodyParser.json())

app.post('/api/send-sms', async (request, res) => {
    try {
        if ((!request.body.recipient && !request.body.identifier) || (!request.body.message && !request.body.otp)) {
            return res.status(400).json({ error: 'Missing required fields: recipient and message' });
        }
        
        const { recipient, message, identifier, otp } = request.body

        const authString = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
        const data = JSON.stringify({
            sendid: senderId,
            recipient: [{ dstno: recipient || identifier, msg: message || otp, type: 1 }],
            agreedterm: 'YES',
            method: 'isms_send_all_id',
            });
            
        const requestOptions = {
            hostname: smsGatewayUrl.hostname,
            path: smsGatewayUrl.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                Authorization: authString,
            },
        }
                
        const req = https.request(requestOptions, (response) => {
            let responseData = ''
            response.on('data', (chunk) => {
                responseData += chunk
            })
            
            response.on('end', () => {
                try {
                    const responseObject = JSON.parse(responseData)
                    res.json(responseObject)
                } catch (error) {
                    console.error('Error parsing response:', error)
                    res.status(500).json({ error: 'Failed to process SMS response' })
                }
            })
        })
        
        req.on('error', (error) => {
            console.error('Error sending SMS request:', error)
            res.status(500).json({ error: 'Failed to send SMS' })
        })
            
        req.write(data)
        req.end()
    } catch (error) {
        console.error('Error in send-sms handler:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})
    
    app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})
