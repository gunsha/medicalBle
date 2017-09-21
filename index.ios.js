import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Button,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ListView,
  ScrollView
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import GlucoseUtils from './glucoseUtils.js';
import BleDevices from './bleDevices.js';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

let ox2 = '';
let pr = '';

export default class medicalBle extends Component {
  constructor() {
    super();
    this.state = {
      scanning: false,
      peripherals: new Map()
    };

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
  }
  componentDidMount() {
    BleManager.start({ showAlert: false, allowDuplicates: false });

    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral);
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan);
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral);
    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic);



    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
        if (result) {
          console.log("Permission is OK");
        } else {
          PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
            if (result) {
              console.log("User accept");
            } else {
              console.log("User refuse");
            }
          });
        }
      });
    }
  }

  componentWillUnmount() {
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    this.handlerDisconnect.remove();
    this.handlerUpdate.update();
  }

  handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({ peripherals });
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  handleUpdateValueForCharacteristic(data) {
    console.log(BleDevices.getDevice({ id: data.peripheral }).dataParse(data,BleDevices));
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
  }

  scan() {
    if (!this.state.scanning) {
      BleManager.scan([], 3, true).then((results) => {
        console.log('Scanning...');
        this.setState({ scanning: true });
      });
    }
  }

  handleDiscoverPeripheral(peripheral) {
    var peripherals = this.state.peripherals;
    if (!peripherals.has(peripheral.id)) {
      console.log('Got ble peripheral', peripheral);
      var device = BleDevices.getDevice(peripheral);
      if (device) {
        this.connect(device);
        BleManager.stopScan();
        peripherals.set(peripheral.id, device);
        this.setState({ peripherals })
      }
    }
  }

  connect(item) {
    this.activeid = item.id;

    BleManager.connect(item.id).then(device => {
      console.log(JSON.stringify(device));
      BleManager.retrieveServices(item.id)
        .then((peripheralInfo) => {

          console.log('Peripheral info:', peripheralInfo);

          for (var i in item.characteristics) {
            var c = item.characteristics[i];
            for (var e in c.type) {
              if (c.type[e].name === 'notify') {
                BleManager.startNotification(item.id, c.service, c.id);
              }
              if (c.type[e].name === 'write') {
                BleManager.write(item.id, c.service, c.id, c.type[e].value);
              }
            }
          }
        });

    }, error => {
      this.d = error;
      console.log(error);
    });

  }
  render() {
    return (
      <View style={styles.container}>
        <Button
          onPress={() => this.scan()}
          title="Scan"
          color="#841584"
          accessibilityLabel="Learn more about this purple button"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

AppRegistry.registerComponent('medicalBle', () => medicalBle);
