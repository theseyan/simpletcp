/**
 * SimpleTCP
 * A lightweight library for easy machine-machine communication through TCP
 * @author Tekyon Open Source
*/

(function() {

    // Default input delimeter in case a custom delimeter is not provided
    var DefaultInputDelimiter = "<|EOL|>";

    // Helper function to fire all event handlers for a specified event
    function fireEvents(event, data, events) {
        if(!events[event]) return;
        for(var i=0; i<=events[event].length-1; i++) {
            events[event][i](data);
        }
    }

    /**
     * @class Server
     * Library class for dealing with TCP Servers
    */
    class Server {

        /**
         * @constructor
        */
        constructor(server, options) {

            // Save the server instance
            this.server = server;

            // Stores the clients connected to this server
            this.clients = [];

            // Stores input data buffer
            this.inputBuffer = [];

            // Delimeter to identify end of input stream
            this.inputDelimeter = (typeof options=="undefined" || !options.inputDelimeter) ? DefaultInputDelimiter : options.inputDelimeter;

            // Stores event handlers for all server & custom events
            this.eventHandlers = [];

        }

        /**
         * Writes to a connected client or a group of clients
        */
        write(data, clients) {

            // Write to all connected clients
            if(typeof clients=="undefined") {
                this.clients.forEach((client, index, array) => {
                    client.write(data.concat(this.inputDelimeter));
                });
            }

            // Write to a subset of connected clients
            else {
                clients.forEach((client, index, array) => {
                    if((typeof client).toLowerCase() === 'string') this.clients[client].write(data.concat(this.inputDelimeter));
                    else client.write(data.concat(this.inputDelimeter));
                });
            }
        }

        /**
         * Flushes the input buffer for a connected client
        */
        flushInputBuffer(id) {
            this.inputBuffer[id] = [];

            // Fire 'inputBufferFlush' event
            fireEvents('inputBufferFlush', {
                client: this.clients[id]
            }, this.eventHandlers);
        }

        /**
         * Checks if a fully constructed message is formed at the input buffer
        */
        checkInputBuffer(id) {
            var buffer = this.inputBuffer[id].join("");
            while(buffer.indexOf(this.inputDelimeter) !== -1) {
                var index = buffer.indexOf(this.inputDelimeter);
                var message = buffer.substring(0, index);
                var rest = (index===-1) ? buffer : buffer.substring((index + this.inputDelimeter.length), buffer.length);

                // Flush input buffer
                this.flushInputBuffer(id);

                if(rest!=="") this.inputBuffer[id].push(rest);
                buffer = rest;

                // Fire 'message' event
                fireEvents('message', {
                    client: this.clients[id],
                    data: message
                }, this.eventHandlers);

            }
        }

        /**
         * Starts the TCP server and begins listening at the specified port and host
        */
        listen(port, host) {
            return new Promise((resolve, reject) => {
                this.server.listen(port, host, () => {
                    fireEvents('listen', {
                        port: port,
                        host: host
                    }, this.eventHandlers);

                    resolve();
                });

                // Handle new connections
                this.server.on('connection', (sock) => {

                    var ID = sock.remoteAddress + ':' + sock.remotePort;

                    // Accept only UTF-8 strings
                    sock.setEncoding('utf8');

                    // Add socket client to clients array
                    this.clients[ID] = sock;

                    // Create an input buffer array for this client
                    this.inputBuffer[ID] = [];

                    // Fire 'connection' event handlers
                    fireEvents('connection', sock, this.eventHandlers);
                
                    // Handle incoming data
                    sock.on('data', (data) => {

                        // Add incoming data to input buffer
                        this.inputBuffer[ID].push(data);

                        // Check if a message has been constructed
                        this.checkInputBuffer(ID);

                        // Fire 'data' event handlers
                        fireEvents('data', {
                            client: sock,
                            data: data
                        }, this.eventHandlers);

                    });
                
                    // Handle connection close
                    sock.on('close', (data) => {

                        // Remove client from connected clients array
                        var index = this.clients.findIndex(function(o) {
                            return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
                        });
                        if (index !== -1) this.clients.splice(index, 1);

                        // Fire 'close' event handlers
                        fireEvents('close', {
                            client: sock,
                            data: data
                        }, this.eventHandlers);

                    });

                    // Handle errors
                    sock.on('error', (error) => {
                        // Fire 'error' event handlers
                        fireEvents('error', {
                            client: sock,
                            error: error
                        }, this.eventHandlers);
                    });

                });
            });
        }

        /**
         * Registers an event handler corresponding to the provided event
        */
        on(evt, handler) {

            if(!this.eventHandlers[evt]) this.eventHandlers[evt] = [];
            this.eventHandlers[evt].push(handler);

        }

    }

    /**
     * @class Client
     * Library class for dealing with TCP socket clients
    */
    class Client {

        /**
         * @constructor
        */
        constructor(client, options) {

            // Save the client instance
            this.client = client;

            // Stores input data buffer
            this.inputBuffer = [];

            // Delimeter to identify end of input stream
            this.inputDelimeter = (typeof options=="undefined" || !options.inputDelimeter) ? DefaultInputDelimiter : options.inputDelimeter;

            // Stores event handlers for all server & custom events
            this.eventHandlers = [];

        }

        /**
         * Writes to the connected server
        */
        write(data) {
            this.client.write(data.concat(this.inputDelimeter));
        }

        /**
         * Flushes the input buffer for a connected client
        */
        flushInputBuffer() {
            this.inputBuffer = [];

            // Fire 'inputBufferFlush' event
            fireEvents('inputBufferFlush', {}, this.eventHandlers);
        }

        /**
         * Checks if a fully constructed message is formed at the input buffer
        */
        checkInputBuffer() {
            var buffer = this.inputBuffer.join("");
            while(buffer.indexOf(this.inputDelimeter) !== -1) {
                var index = buffer.indexOf(this.inputDelimeter);
                var message = buffer.substring(0, index);
                var rest = (index===-1) ? buffer : buffer.substring((index + this.inputDelimeter.length), buffer.length);

                // Flush input buffer
                this.flushInputBuffer();

                if(rest!=="") this.inputBuffer.push(rest);
                buffer = rest;

                // Fire 'message' event
                fireEvents('message', {
                    data: message
                }, this.eventHandlers);

            }
        }

        /**
         * Connects to a TCP server
        */
        connect(port, host) {
            return new Promise((resolve, reject) => {
                this.client.connect(port, host, () => {
                    fireEvents('connection', {
                        port: port,
                        host: host
                    }, this.eventHandlers);

                    resolve();
                });

                // Write only UTF-8 strings
                this.client.setEncoding('utf8');
            
                // Handle incoming data
                this.client.on('data', (data) => {

                    // Add incoming data to input buffer
                    this.inputBuffer.push(data);

                    // Check if a message has been constructed
                    this.checkInputBuffer();

                    // Fire 'data' event handlers
                    fireEvents('data', {
                        data: data
                    }, this.eventHandlers);

                });
            
                // Handle connection close
                this.client.on('close', (data) => {

                    // Fire 'close' event handlers
                    fireEvents('close', {
                        data: data
                    }, this.eventHandlers);

                });

                // Handle errors
                this.client.on('error', (error) => {
                    // Fire 'error' event handlers
                    fireEvents('error', {
                        error: error
                    }, this.eventHandlers);
                });
            });
        }

        /**
         * Registers an event handler corresponding to the provided event
        */
        on(evt, handler) {

            if(!this.eventHandlers[evt]) this.eventHandlers[evt] = [];
            this.eventHandlers[evt].push(handler);

        }

    }

    var SimpleTCP = {
        Server: Server,
        Client: Client
    };

    // Export the library classes
    if(typeof module!="undefined" && module.exports) module.exports = SimpleTCP;

})();