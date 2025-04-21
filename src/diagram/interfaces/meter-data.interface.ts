export interface MeterData {
    authorized: true;
    meter: {
      meter_id: string;
      meter_title: string;
      [key: string]: string | number;
    };
  }
  