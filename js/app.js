import { Socket } from './socket.js';

export const App = class {
    constructor() {
        this.socket = new Socket()
    }

    log = (packet) => {
        console.log(packet);
        document.getElementById("data").innerText = packet.payload;
    }

    start_listner = (topic) => {
        this.socket.add_listener(topic, this.log)
    }

    stop_listener = (topic) => {
        this.socket.remove_listener(topic, this.log)
    }
}
