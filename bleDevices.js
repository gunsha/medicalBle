class BleDevices {
    constructor() {

    }
    devices = [
        {
            name: 'mc70', id: "1FD9381C-9BED-D6B1-D724-A4DB50FB3045", characteristics: [
                { service: 'FFE0', id: 'FFE1', type: [{ name: 'notify' }] }
            ],
            dataParse: function (data) {
                if (data.value[0] != 170 && data.value[3] != 65 && data.value[19] == 0) {
                    return {
                        ox2: data.value[16] != 127 ? data.value[16] + '' : '--',
                        pr: data.value[17] != 255 ? data.value[17] + '' : '--'
                    }
                }
            }
        },
        {
            name: 'nonin', id: "6B1A5D59-FBE4-EA23-FEFC-7A97F951B111", characteristics: [
                { service: '1822', id: '2A5F', type: [{ name: 'notify' }] }
            ],
            dataParse: function (data,_this) {
                return {
                    ox2: _this.Ieee11073ToSingle(data.value[1], data.value[2]) + '',
                    pr: data.value[3] + ''
                }
            }
        },
        {
            name: 'accucheck', id: "B5EEA7A7-5F24-0B39-61DF-C8C26959B576", characteristics: [
                { service: '1808', id: '2A18', type: [{ name: 'notify' }] },
                { service: '1808', id: '2A52', type: [{ name: 'notify' }, { name: 'write', value: [0x01, 0x01] }] },
            ],
            dataParse: function (data,_this) {
                return { 
                    date: _this.GetGlucoseDate(data.value), 
                    value: (_this.Ieee11073ToSingle(data.value[12], data.value[13]) * 100000).toFixed() 
                };
            }
        }
    ];

    getDevice(device) {
        for (var i in this.devices) {
            if (device.id == this.devices[i].id)
                return this.devices[i];
        }
        return null;
    }

    Ieee11073ToSingle(byte1, byte2) {
        var ieee11073 = (byte1 + 0x100 * byte2);
        var mantissa = ieee11073 & 0x0FFF;

        if (mantissa >= 0x0800)
            mantissa = -(0x1000 - mantissa);
        var exponent = ieee11073 >> 12;
        if (exponent >= 0x08)
            exponent = -(0x10 - exponent);
        var magnitude = Math.pow(10, exponent);
        return (mantissa * magnitude);
    }

    getUInt16(lsb, msb) {
        return (((0xff & msb) << 8) | (0xff & lsb));
    }

    GetGlucoseDate(buffer) {
        var _buffer = [];
        for(var i in buffer){
            if(i>=3){
                _buffer.push(buffer[i]);
            }
        }
        if ((_buffer != null) && (_buffer.length >= 7)) {
            var index = 0;
            var year = this.getUInt16(_buffer[index], _buffer[index + 1]) & 0xffff;
            index += 2;
            var month = (_buffer[index++] & 0xff) - 1;
            var day = _buffer[index++] & 0xff;
            var hour = _buffer[index++] & 0xff;
            var min = _buffer[index++] & 0xff;
            var d = new Date(year, month, day, hour, min, 0, 0);
            return new Date(d.getTime()-11100000);
        }
        return null;
    }

}
module.exports = new BleDevices();
