console.log("[IWGPT] loaded");
// log valeur de  doc.readyState
console.log("[IWGPT] doc.readyState: " + document.readyState);
window.csTest = 42;

const NativeWebSocket = window.WebSocket;

class MyCustomWebSocket extends NativeWebSocket {
  constructor(url, protocols) {
    console.log(`[IWGPT] Intercepting connection to: ${url}`);
    console.log(`[IWGPT] Protocols: ${protocols}`);
    // original constructor call
    super(url, protocols);

    // intercept what's in the message event (this = websocket)
    this.addEventListener('message', (event) => {
      console.log(`[IWGPT] Message received: ${event.data}`);
    });
  }
}

window.WebSocket = MyCustomWebSocket;