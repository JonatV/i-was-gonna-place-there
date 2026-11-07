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

    // intercepts what's in the message event (this = websocket)
    this.addEventListener('message', (event) => {
      try {
        if (typeof event.data === 'string') {
          console.log(`${LOG_TAG} Message is a string: ${event.data}`);
        } else if (event.data instanceof Blob) {
          console.log(`${LOG_TAG} Message is a Blob`);
        } else if (event.data instanceof ArrayBuffer) {
          console.log(`${LOG_TAG} Message is an ArrayBuffer`);
          console.log(`${LOG_TAG} ArrayBuffer byte length: ${event.data.byteLength}`);
          const buffer = new Uint8Array(event.data);
          const sub = buffer.subarray(0, 8);
          const hex = Array.from(sub, byte => byte.toString(16).padStart(2, '0')).join(' ').toUpperCase();
          console.log(`${LOG_TAG} ${hex}...`);
        } else {
          console.log(`${LOG_TAG} Message is of unknown type`);
        }
      } catch (error) {
        console.error(`${LOG_TAG} Error while treating message: ${error}`);
      }
    });
  }
}

window.WebSocket = MyCustomWebSocket;