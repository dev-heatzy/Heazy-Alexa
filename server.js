const heatzy = require('./heatzy-alexa-http').heatzy;

/*
 * server.js
 * This file is the core of your bot
 *
 * It creates a little server using express
 * So, your bot can be triggered thought "/" route
 */

const express = require('express')
const bodyParser = require('body-parser')


// Start Express server
const app = express()
app.set('port', 8080)
app.use(bodyParser.json())

// Handle / route
app.use('/heatzyAlexa/mode', (request, response) => {

  // Call bot main function
  heatzy(request.body, response);

})

// Run Express server, on right port
app.listen(app.get('port'), () => {
  console.log('Our bot is running on port', app.get('port'))
})