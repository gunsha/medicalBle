class GlucoseUtils {
    constructor() {

    }
    ExtractGlucoseConcentration(buffer) {
        return (this.GetSfloat(buffer[12], buffer[13]) * 100000).toFixed();
    }
    GetSfloat(byte1, byte2) {
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
    GetDate(buffer) {
        if ((buffer != null) && (buffer.length >= 7)) {
            var index = 0;
            var year = this.getUInt16(buffer[index], buffer[index + 1]) & 0xffff;
            index += 2;
            var month = buffer[index++] & 0xff;
            var day = buffer[index++] & 0xff;
            var hour = buffer[index++] & 0xff;
            var min = buffer[index++] & 0xff;
            var sec = buffer[index] & 0xff;
            console.log(year+" "+ month+" "+ day+" "+ hour+" "+ min+" "+ sec);
            return new Date(year, month, day, hour, min, sec, 0);
        }
        return null;
    }
    getUInt16(lsb, msb) {
        return (((0xff & msb) << 8) | (0xff & lsb));
    }
}
module.exports = new GlucoseUtils();
