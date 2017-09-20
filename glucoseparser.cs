namespace Roche.BLELib.Profile.Core
{
    using Roche.BLELib.Utility.Core;
    using System;

    public class GlucoseMeasurementParser : IParser
    {
        private const int MandatoryFieldsSize = 10;

        private static DateTimeWrapper ExtractBaseTime(ByteBufferReader byteBuffer)
        {
            byte[] buffer;
            byteBuffer.GetBytes(7, out buffer);
            return ByteUtility.GetDate(buffer);
        }

        private static double ExtractGlucoseConcentration(ByteBufferReader byteBuffer)
        {
            byte[] buffer;
            byteBuffer.GetBytes(ByteUtility.GetSizeofSfloat(), out buffer);
            return ByteUtility.GetSfloat(buffer[0], buffer[1]);
        }

        private static GlucoseMeasurement.MeasurementType ExtractMeasurementType(sbyte tempByte) => 
            ((GlucoseMeasurement.MeasurementType) ByteUtility.GetLeastSignificantNibble((byte) tempByte));

        private static GlucoseMeasurement.SampleLocation ExtractSampleLocation(sbyte tempByte) => 
            ((GlucoseMeasurement.SampleLocation) ByteUtility.GetMostSignificantNibble((byte) tempByte));

        private static int ExtractSensorStatusAnnunciation(ByteBufferReader byteBuffer) => 
            ByteUtility.GetShort(byteBuffer);

        private static int ExtractSequenceNumber(ByteBufferReader byteBuffer) => 
            ByteUtility.GetShort(byteBuffer);

        private static int ExtractTimeOffset(ByteBufferReader byteBuffer)
        {
            short num;
            byteBuffer.ToInt16(out num);
            return num;
        }

        public virtual string GetName() => 
            "Glucose Measurement";

        public virtual GlucoseMeasurement.GlucoseUnits GetUnits(int flagByte)
        {
            int num;
            if ((flagByte & 4) == 0)
            {
                num = 1;
            }
            else
            {
                num = 2;
            }
            return (GlucoseMeasurement.GlucoseUnits) ((short) num);
        }

        private static bool IsContexInfoFollows(int flagByte) => 
            ((flagByte & 0x10) != 0);

        public virtual bool IsGlucoseMeasurementPresent(int flagByte) => 
            ((flagByte & 2) != 0);

        public virtual bool IsSensorStatusPresent(int flagByte) => 
            ((flagByte & 8) != 0);

        public virtual bool IsTimeOffsetPresent(int flagByte) => 
            ((flagByte & 1) != 0);

        public virtual IData Parse(byte[] buffer)
        {
            GlucoseMeasurement measurement = null;
            if (buffer != null)
            {
                LogUtilities.ILog<GlucoseMeasurementParser>("Glucose measurement byte stream = " + ByteUtility.GetHexString(buffer, 0, buffer.Length));
                measurement = (GlucoseMeasurement) this.ParseBuffer(buffer);
            }
            return measurement;
        }

        private IData ParseBuffer(byte[] buffer)
        {
            GlucoseMeasurement measurement = null;
            int timeoffset = 0;
            double glucoseConcentration = 0.0;
            GlucoseMeasurement.GlucoseUnits units = ~GlucoseMeasurement.GlucoseUnits.Invalid;
            GlucoseMeasurement.MeasurementType reservedForFutureUse = GlucoseMeasurement.MeasurementType.ReservedForFutureUse;
            GlucoseMeasurement.SampleLocation sampleLocation = GlucoseMeasurement.SampleLocation.ReservedForFutureUse;
            int sensorStatusAnnucation = 0;
            if ((buffer != null) && (buffer.Length > 10))
            {
                try
                {
                    byte num6;
                    ByteBufferReader byteBuffer = new ByteBufferReader(buffer, EndianType.LittleEndian);
                    byteBuffer.GetByte(out num6);
                    int flagByte = num6;
                    int sequenceNumber = ExtractSequenceNumber(byteBuffer);
                    DateTimeWrapper baseTime = ExtractBaseTime(byteBuffer);
                    if (this.IsTimeOffsetPresent(flagByte))
                    {
                        timeoffset = ExtractTimeOffset(byteBuffer);
                    }
                    if (this.IsGlucoseMeasurementPresent(flagByte))
                    {
                        byte num7;
                        glucoseConcentration = ExtractGlucoseConcentration(byteBuffer);
                        units = this.GetUnits(flagByte);
                        byteBuffer.GetByte(out num7);
                        sbyte tempByte = (sbyte) num7;
                        reservedForFutureUse = ExtractMeasurementType(tempByte);
                        sampleLocation = ExtractSampleLocation(tempByte);
                    }
                    if (this.IsSensorStatusPresent(flagByte))
                    {
                        sensorStatusAnnucation = ExtractSensorStatusAnnunciation(byteBuffer);
                    }
                    bool contextInfoFollows = IsContexInfoFollows(flagByte);
                    measurement = new GlucoseMeasurement();
                    measurement.SetSequenceNumber(sequenceNumber);
                    measurement.SetBaseTime(baseTime);
                    measurement.SetTimeOffset(timeoffset);
                    measurement.SetGlucoseConcentration(glucoseConcentration);
                    measurement.SetUnits(units);
                    measurement.SetMeasurementType(reservedForFutureUse);
                    measurement.SetSampleLocation(sampleLocation);
                    measurement.SetSensorStatusAnnunciation(sensorStatusAnnucation);
                    measurement.SetContexInfoFlow(contextInfoFollows);
                }
                catch (Exception exception)
                {
                    LogUtilities.ELog<GlucoseMeasurementParser>("Exception in ParseBuffer", exception);
                }
            }
            return measurement;
        }
    }
}

