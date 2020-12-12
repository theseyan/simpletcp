/**
 * SimpleTCP Examples
 * Basic Server/Client connection example
*/

var SimpleTCP = require('./../../SimpleTCP');
var net = require('net');

// Port & host for the server
const port = 7070;
const host = '127.0.0.1';

// Create a server
var server = new SimpleTCP.Server(net.createServer());

// Start the server
server.listen(port, host).then(() => {

    console.log("TCP server listening at " + host + " on port " + port);

});

// Handle new connections
server.on("connection", (client) => {
    console.log("Client connected to the server with IP: " + client.remoteAddress + " & Port: " + client.remotePort);
});

// Handle lost connections
server.on("close", (data) => {
    console.log("Client disconnected with IP: " + data.client.remoteAddress + " & Port: " + data.client.remotePort);
});

// Handle incoming data
server.on("message", (data) => {
    console.log("Client with ID " + data.client.remoteAddress + ":" + data.client.remotePort + " wrote: " + data.data);
});