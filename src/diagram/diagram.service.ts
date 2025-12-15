import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DiagramService {
  private readonly sourceUrl = 'http://43.204.118.114:6881/prime_cold';

  private readonly meterTitles: Record<string, string> = {
    "U1": "Wapda",/*  */
    "U2": "Solar",
    "U3": "Compressor1",
    "U4": "Compressor2",
    "U5": "Compressor3",
    "U_8_EM8": "ML-132",
    "U_9_EM9": "New Centac Com#1",
    "U_15": "Dryer",
    "U_21": "Janitza",
    "U_10_EM10": "Kaeser Compressor",
    "U_22": "Solar Hostels",
  };

  private readonly powerKeys = [
    "CurrentTHD_PH1", "CurrentTHD_PH2", "CurrentTHD_PH3",
    "VoltageTHD_PH1", "VoltageTHD_PH2", "VoltageTHD_PH3",
    "Activepower_PH1_W", "Activepower_PH2_W", "Activepower_PH3_W",
    "Activepower_Total_W", "ReAPower_PH1_VAR", "ReAPower_PH2_VAR",
    "ReAPower_PH3_VAR", "ReAPower_Total_VAR", "AppPower_PH1_VA",
    "AppPower_PH2_VA", "AppPower_PH3_VA", "AppPower_Total_VA"
  ];

  private readonly energyKeys = [
    "FWD_ActiveEnergy_Wh", "Rev_ActiveEnergy_Wh", "TotalActiveEnergy_kWh",
    "FWD_ReAInductiveEnergy_VARh", "FWD_ReACapacitiveEnergy_VARh",
    "Rev_ReAInductiveEnergy_VARh", "Rev_ReACapacitiveEnergy_VARh",
    "TotalReactiveEnergy_Capacitive_kVARh", "TotalReactiveEnergy_Inductive_kVARh",
    "FWD_AppEnergy_VAh", "Rev_AppEnergy_VAh", "TotalApparentEnergy_kVAh"
  ];

  private readonly voltsKeys = [
    'CurrentPh3_A', 'CurrentPh2_A', 'CurrentPh1_A', 'CurrentAvg_A',
    'Voltage_Ph3ToPh1_V', 'Voltage_Ph2ToPh3_V', 'Voltage_Ph1ToPh2_V',
    'AvgVoltageLL_V', 'Voltage_pH1ToN_V', 'Voltage_pH2ToN_V',
    'Voltage_pH3ToN_V', 'VoltageLN_V', 'Activepower_PH3_W',
    'Activepower_PH2_W', 'Activepower_PH1_W', 'Activepower_Total_W',
    'ReAPower_Total_VAR', 'AppPower_Total_VA', 'Freq_Hz',
    'PF_Avg', 'PF_PH1', 'PF_PH2', 'PF_PH3'
  ];

  async fetchMeterData(type: 'power' | 'energy' | 'volts', meter: string) {
    if (!this.meterTitles[meter]) {
      return { authorized: false, error: "Invalid or missing meter ID." };
    }

    try {
      const response = await axios.get(this.sourceUrl);
      const data = response.data;

      const meterData: any = {
        meter_id: meter,
        meter_title: this.meterTitles[meter],
      };

      const selectedKeys = type === 'power' ? this.powerKeys :
                           type === 'energy' ? this.energyKeys :
                           this.voltsKeys;

      for (const key of selectedKeys) {
        const fullKey = `${meter}_${key}`;
        meterData[key] = data[fullKey] !== undefined ? parseFloat(data[fullKey].toFixed(2)) : 0;
      }

      return {
        authorized: true,
        meter: meterData
      };

    } catch (error) {
      return {
        authorized: false,
        error: "Unable to fetch data from source API."
      };
    }
  }
}
