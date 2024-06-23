/** Class used to manage connection with node server. 
 * @class
*/
export const Socket = class {
	constructor() {
		this.socket = io();
	}

	add_listener = (event, callback) => {
		return this.socket.on(event, callback);
	}

	remove_listener = (event, callback) => {
		this.socket.off(event, callback);
	}
}