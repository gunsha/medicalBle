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

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const devices = { mc70: "1FD9381C-9BED-D6B1-D724-A4DB50FB3045", nonin: "6B1A5D59-FBE4-EA23-FEFC-7A97F951B111" };
let ox2 = '';
let pr = '';

export default class MainView extends Component {
  constructor() {
    super()
    this.state = {
      scanning: false,
      peripherals: new Map()
    }

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

    if (data.peripheral == devices.nonin) {
      ox2 = this.Ieee11073ToSingle(data.value) + '';
      pr = data.value[3] + '';
    }
    
    if (data.peripheral == devices.mc70) {
      if (data.value[0] != 170 && data.value[3] != 65 && data.value[19] == 0) {
        ox2 = data.value[16] != 127 ? data.value[16] + '' : '--';
        pr = data.value[17] != 255 ? data.value[17] + '' : '--';
      }
    }
    console.log('spO2 ' + ox2 + ' PR ' + pr)

    //console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
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

      if (peripheral.id === devices.mc70 || peripheral.id === devices.nonin) {
        this.connect(peripheral);
        BleManager.stopScan();
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals })
      }

    }
  }

  connect(item) {
    this.activeid = item.id;

    BleManager.connect(item.id).then(device => {
      console.log(JSON.stringify(device));
      if (item.id === devices.mc70) {
        BleManager.retrieveServices(item.id)
          .then((peripheralInfo) => {
            // Success code
            console.log('Peripheral info:', peripheralInfo);
            this.read({ "id": item.id, "characteristic": "FFE1", "service": "FFE0" });
          });
      }
      if (item.id === devices.nonin) {
        BleManager.retrieveServices(item.id)
          .then((peripheralInfo) => {
            console.log('Peripheral info:', peripheralInfo);
            this.read({ "id": item.id, "characteristic": "2A5F", "service": "1822" });
          });
      }
    }, error => {
      this.d = error;
      console.log(error);
    });

  }
  Ieee11073ToSingle(bytes) {
    var ieee11073 = (bytes[1] + 0x100 * bytes[2]);
    var mantissa = ieee11073 & 0x0FFF;

    if (mantissa >= 0x0800)
      mantissa = -(0x1000 - mantissa);
    var exponent = ieee11073 >> 12;
    if (exponent >= 0x08)
      exponent = -(0x10 - exponent);
    var magnitude = Math.pow(10, exponent);
    return (mantissa * magnitude);
  }
  repeat(str, num) {
    if (str.length === 0 || num <= 1) {
      if (num === 1) {
        return str;
      }

      return '';
    }

    var result = '',
      pattern = str;

    while (num > 0) {
      if (num & 1) {
        result += pattern;
      }

      num >>= 1;
      pattern += pattern;
    }

    return result;
  }

  lpad(obj, str, num) {
    return this.repeat(str, num - obj.length) + obj;
  }
  read(item) {
    var that = this;

    BleManager.startNotification(item.id, item.service, item.characteristic);
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
