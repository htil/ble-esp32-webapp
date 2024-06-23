# This file is executed on every boot (including wake-boot from deepsleep)
#import esp
#esp.osdebug(None)
#import webrepl
#webrepl.start()

from micropython import const
import asyncio
import aioble
import bluetooth
import struct
from machine import Pin
from random import randint
import network

# Init LED
led = Pin(2, Pin.OUT)
led.value(0)

# Init random value
value = 0

# See the following for generating UUIDs:
# https://www.uuidgenerator.net/
_BLE_SERVICE_UUID = bluetooth.UUID('19b10000-e8f2-537e-4f6c-d104768a1214')
_BLE_SENSOR_CHAR_UUID = bluetooth.UUID('19b10001-e8f2-537e-4f6c-d104768a1214')
_BLE_LED_UUID = bluetooth.UUID('19b10002-e8f2-537e-4f6c-d104768a1214')
_BLE_WIFI_UUID = bluetooth.UUID('19b10003-e8f2-537e-4f6c-d104768a1214')

# How frequently to send advertising beacons.
_ADV_INTERVAL_MS = 250_000

# Register GATT server, the service and characteristics
ble_service = aioble.Service(_BLE_SERVICE_UUID)
sensor_characteristic = aioble.Characteristic(ble_service, _BLE_SENSOR_CHAR_UUID, read=True, notify=True)
led_characteristic = aioble.Characteristic(ble_service, _BLE_LED_UUID, read=True, write=True, notify=True, capture=True)
wifi_characteristic = aioble.Characteristic(ble_service, _BLE_WIFI_UUID, read=True, write=True, notify=True, capture=True)
wifi_password = ""
wifi_ssid = ""

# Register service(s)
aioble.register_services(ble_service)

# Helper to encode the data characteristic UTF-8
def _encode_data(data):
    return str(data).encode('utf-8')

# Helper to decode the characteristic encoding (bytes).
def _decode_data(data, data_type):
    try:
        if data is not None:
            # Decode the UTF-8 data
            if data_type == "number":
                number = int.from_bytes(data, 'big')
                return number
            if data_type == "string":
                string_msg = data.decode("utf-8")
                return string_msg
    except Exception as e:
        print("Error decoding temperature:", e)
        return None

# Get sensor readings
def get_random_value():
    return randint(0,100)

# Get new value and update characteristic
async def sensor_task():
    while True:
        value = get_random_value()
        sensor_characteristic.write(_encode_data(value), send_update=True)
        #print('New random value written: ', value)
        await asyncio.sleep_ms(1000)
        
# Serially wait for connections. Don't advertise while a central is connected.
async def peripheral_task():
    while True:
        try:
            async with await aioble.advertise(
                _ADV_INTERVAL_MS,
                name="ESP32",
                services=[_BLE_SERVICE_UUID],
                ) as connection:
                    print("Connection from", connection.device)
                    await connection.disconnected()             
        except asyncio.CancelledError:
            # Catch the CancelledError
            print("Peripheral task cancelled")
        except Exception as e:
            print("Error in peripheral_task:", e)
        finally:
            # Ensure the loop continues to the next iteration
            await asyncio.sleep_ms(100)

async def wait_for_write():
    while True:
        try:
            connection, data = await led_characteristic.written()
            data = _decode_data(data, "number")
            if data == 1:
                print('Turning LED ON')
                led.value(1)
            elif data == 0:
                print('Turning LED OFF')
                led.value(0)
            else:
                print('Unknown command')
        except asyncio.CancelledError:
            # Catch the CancelledError
            print("Peripheral task cancelled")
        except Exception as e:
            print("Error in peripheral_task:", e)
        finally:
            # Ensure the loop continues to the next iteration
            await asyncio.sleep_ms(100)

def try_wifi_connect():
    if (wifi_ssid != "") and (wifi_password != ""):
        #print("ready to connect: " + wifi_password + " " + wifi_ssid)
        wifi_connect()
        
def wifi_connect():
    led.value(0)
    sta = network.WLAN(network.STA_IF)
    if not sta.isconnected():
        print('connecting to network...')
        sta.active(True)
        #print("wifi: " + wifi_ssid + " " + wifi_password)
        sta.connect(wifi_ssid, wifi_password)
        while not sta.isconnected():
            pass
        print("connected")
        led.value(1)
            
async def wait_for_wifi_write():
    global wifi_ssid
    global wifi_password
    while True:
        try:
            connection, data = await wifi_characteristic.written()
            data = _decode_data(data, "string")
            #print(data)
            if "ss::" in data:
                wifi_ssid = data.split("ss::")[1]
                try_wifi_connect()
            elif "ps::" in data:
                wifi_password = data.split("ps::")[1]
                try_wifi_connect()    
        except asyncio.CancelledError:
            # Catch the CancelledError
            print("Peripheral task cancelled")
        except Exception as e:
            print("Error in peripheral_task:", e)
        finally:
            # Ensure the loop continues to the next iteration
            await asyncio.sleep_ms(100)
            
# Run tasks
async def main():
    t1 = asyncio.create_task(sensor_task())
    t2 = asyncio.create_task(peripheral_task())
    t3 = asyncio.create_task(wait_for_write())
    t4 = asyncio.create_task(wait_for_wifi_write())

    await asyncio.gather(t1, t2)
    
asyncio.run(main())