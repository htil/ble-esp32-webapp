/** Class used to manage connection with BLE devices.
 * @class
 */
export const BLE = class {
  constructor(device_name="ESP32") {
    this.device_name = device_name;
    this.ble_service = "19b10000-e8f2-537e-4f6c-d104768a1214";
    this.led_characteristic = "19b10002-e8f2-537e-4f6c-d104768a1214";
    this.sensor_characteristic = "19b10001-e8f2-537e-4f6c-d104768a1214";
    this.wifi_credentions = "19b10003lp.;=-e8f2-537e-4f6c-d104768a1214";
    this.ble_server = null;
    this.ble_service_found = false;
    this.sensor_characteristic_found = false;
    this.led_state = 0

    const connectButton = document.getElementById("connect_button");
    document.getElementById("led_toggle").addEventListener('click', () => this.write_characteristic(this.led_state));

    // Connect Button (search for BLE Devices only if BLE is available)
    connectButton.addEventListener("click", (event) => {
      if (this.is_blue_tooth_enabled()) {
        this.connect_to_device();
      }
    });

  }

  is_blue_tooth_enabled = () => {
    return navigator.bluetooth.getAvailability();
  };

  on_disconnect = () => {
    console.log("Device disconnected.");
  }

  on_chracteristic_change = (event) => {
    const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Characteristic value changed: ", newValueReceived);
  }

  write_characteristic = (value) => {
    if (this.ble_server && this.ble_server.connected) {
        this.ble_service_found.getCharacteristic(this.led_characteristic)
        .then(characteristic => {
            console.log("Found the LED characteristic: ", characteristic.uuid);
            const data = new Uint8Array([value]);
            return characteristic.writeValue(data);
        })
    } else {
        console.error ("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    }

    this.led_state = !this.led_state;
  }

  connect_to_device =  () => {
    console.log("Requesting Bluetooth Device...");
    navigator.bluetooth.requestDevice({
        filters: [{name: this.device_name}],
        optionalServices: [this.ble_service]
    })
    .then(device => {
        console.log('Device Selected:', device.name);
        device.addEventListener('gattservicedisconnected', this.on_disconnect);
        return device.gatt.connect();
    })
    .then(gattServer =>{
        this.ble_server = gattServer;
        console.log("Connected to GATT Server");
        console.log(this.ble_service)
        setInterval(() => this.write_characteristic(this.led_state), 1000);
        return this.ble_server.getPrimaryService(this.ble_service);
    })
    .then(service => {
        this.ble_service_found = service;
        console.log("Service discovered:", service.uuid);
        return service.getCharacteristic(this.sensor_characteristic);
    })
    .then(characteristic => {
        console.log("Characteristic discovered:", characteristic.uuid);
        this.sensor_characteristic_found = characteristic;
        characteristic.addEventListener('characteristicvaluechanged', this.on_chracteristic_change);
        characteristic.startNotifications();
        console.log("Notifications Started.");
        return characteristic.readValue();
    })
    .then(value => {
        console.log("Read value: ", value);
        const decodedValue = new TextDecoder().decode(value);
        console.log("Decoded value: ", decodedValue);
    }) 
    .catch(error => {
        console.log('Error: ', error);
    })
  }


};
