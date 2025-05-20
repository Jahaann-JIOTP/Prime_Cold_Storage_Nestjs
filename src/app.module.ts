import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { SolarModule } from './dashboard/solar/solar.module';

import { TransformerModule } from './dashboard/transformer/transformer.module';
import { ConVsProModule } from './dashboard/con_vs_pro/con_vs_pro.module';
import { TrendsModule } from './trends/trends.module';
import { EnergyCostModule } from './energy-cost/energy-cost.module';
import { EnergyUsageModule } from './energy-usage/energy-usage.module';
import { GenerationModule } from './dashboard/generation/generation.module';
import { EnergyModule } from './dashboard/energy/energy.module';
import { DiagramModule } from './diagram/diagram.module';
import { AlarmsModule } from './alarms/alarms.module';
import { PieChartModule } from './dashboard/pie_chart/pie_chart.module';
import { BellModule } from './alarms/bell/bell.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './role/role.module';
import { PrivilegesModule } from './privileges/privileges.module';
import { SolarController } from './dashboard/solar/solar.controller';
import { SolarService } from './dashboard/solar/solar.service';
import { ConVsProController } from './dashboard/con_vs_pro/con_vs_pro.controller';
import { ConVsProService } from './dashboard/con_vs_pro/con_vs_pro.service';
import { DiagramController } from './diagram/diagram.controller';
import { DiagramService } from './diagram/diagram.service';
import { Compressor2Module } from './dashboard/compressor2/compressor2.module';
import { Compressor3Module } from './dashboard/compressor3/compressor3.module';
import { Compressor1Module } from './dashboard/compressor1/compressor1.module';
// import { LogsModule } from './logs/logs.module';
import { LogsDataModule } from './diagram/logs_data/logs_data.module';
import { PrimeColdHrsModule } from './prime-cold-hrs/prime-cold-hrs.module';






@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ Primary DB (iotdb)
    MongooseModule.forRoot(process.env.IOTDB_URI!),
    MongooseModule.forRoot(process.env.ALARMDB_URI!, {
      connectionName: 'Prime_Cold_Alarms',
    }),
    MongooseModule.forRoot(process.env.PRIMECOLD_URI!, {
      connectionName: 'prime_cold',
    }),


    // Your app modules
    DashboardModule,
    SolarModule,
    TransformerModule,
    ConVsProModule,
    TrendsModule,
    EnergyCostModule,
    EnergyUsageModule,
    GenerationModule,
    EnergyModule,
    DiagramModule,
    AlarmsModule,
    PieChartModule,
    BellModule,
    UsersModule,
    AuthModule,
    RolesModule,
    PrivilegesModule,
    Compressor2Module,
    Compressor3Module,
    Compressor1Module,
    // LogsModule,
    LogsDataModule,
    PrimeColdHrsModule,
    
    
   
    
  ],
  controllers: [AppController, SolarController, ConVsProController, DiagramController],
  providers: [AppService, SolarService, ConVsProService, DiagramService],
})
export class AppModule {}
