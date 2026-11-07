const LOG_TAG = "[IWGPT]";

console.log(`${LOG_TAG} loaded`);
// log valeur de  doc.readyState
console.log(`${LOG_TAG} doc.readyState: ${document.readyState}`);
window.csTest = 42;

const NativeWebSocket = window.WebSocket;

class MyCustomWebSocket extends NativeWebSocket {
  constructor(url, protocols) {
    console.log(`${LOG_TAG} Intercepting connection to: ${url}`);
    console.log(`${LOG_TAG} Protocols: ${protocols}`);
    // original constructor call
    super(url, protocols);

    // intercept what's in the message event (this = websocket)
    this.addEventListener('message', (event) => {
      console.log(`${LOG_TAG} Message received: ${event.data}`);
    });
  }
}

window.WebSocket = MyCustomWebSocket;