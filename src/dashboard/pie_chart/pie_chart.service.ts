// src/pie-chart/pie_chart.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PieChart } from './schemas/pie-chart.schema';

@Injectable()
export class PieChartService {
  constructor(@InjectModel('PieChart') private readonly pieChartModel: Model<PieChart>) {}

  async fetchData(startTimestamp: number, endTimestamp: number) {
    try {
      console.log('Start Timestamp:', startTimestamp);
      console.log('End Timestamp:', endTimestamp);

      const data = await this.pieChartModel
        .find({
          UNIXtimestamp: { $gt: startTimestamp, $lte: endTimestamp },
        })
        .select('U2_Active_Energy_Total_Consumed  U1_Active_Energy_Total_Consumed U1_Active_Energy_Total_Supplied')
        .exec();

      console.log('Fetched Data:', data);

      if (data.length === 0) {
        console.log('No data found for the given date range.');
        return [
          {
            category: 'No Data',
            total: 0,
            color: '#cccccc',
            subData: [],
          },
        ];
      }

      const getConsumption = (array: number[]) => {
        if (array.length > 1) return array[array.length - 1] - array[0];
        return 0;
      };

      const solar1Arr = data.map((doc) => doc.U2_Active_Energy_Total_Consumed).filter(Boolean);
      // const solar2Arr = data.map((doc) => doc.U_27_ACTIVE_ENERGY_IMPORT_KWH).filter(Boolean);
      const trans1Arr = data.map((doc) => doc.U1_Active_Energy_Total_Consumed).filter(Boolean);
      // const trans2Arr = data.map((doc) => doc.U_25_ACTIVE_ENERGY_IMPORT_KWH).filter(Boolean);
      const trans2Arr = data.map((doc) => doc.U1_Active_Energy_Total_Supplied).filter(Boolean);

      const S_1 = getConsumption(solar1Arr);
      // const S_2 = getConsumption(solar2Arr);
      const T_1 = getConsumption(trans1Arr);
      // const T_2 = getConsumption(trans2Arr);
      const T_2 = getConsumption(trans2Arr);

      const solarTotal = Math.max(S_1 , 0);
      const transformerTotal = Math.max(T_1 , 0);
      const transformer2Total = Math.max(T_2 , 0);

      console.log('Solar 1:', S_1);
      console.log('Transformer Import:', T_1);

      return [
        {
          category: 'Solar',
          total: solarTotal,
          color: '#e67f22',
          subData: [
            { name: 'Solar 1', value: S_1 },
            // { name: 'Solar 2', value: S_2 },
          ],
        },
        {
          category: 'TransformerImport',
          total: transformerTotal,
          color: '#2980b9',
          subData: [
            { name: 'Transformer Import', value: T_1 },
            // { name: 'Transformer 2', value: T_2 },
          ],
        },
         {
          category: 'TransformerExport',
          total: transformer2Total,
          color: '#27ae60',
          subData: [
            { name: 'Transformer Export', value: T_2 },
            // { name: 'Solar 2', value: S_2 },
          ],
        },
      ];
    } catch (error) {
      console.error('Error while fetching data from MongoDB:', error.message);
      throw new Error('Error while fetching data from MongoDB: ' + error.message);
    }
  }
}
