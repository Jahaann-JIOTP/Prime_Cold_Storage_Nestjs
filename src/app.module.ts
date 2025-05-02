import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardModule } from './dashboard/dashboard.module';
import { ConfigModule } from '@nestjs/config';
import { SolarController } from './dashboard/solar/solar.controller';
import { SolarService } from './dashboard/solar/solar.service';
import { SolarModule } from './dashboard/solar/solar.module';
import { GensetModule } from './dashboard/genset/genset.module';
import { TransformerModule } from './dashboard/transformer/transformer.module';
import { ConVsProService } from './dashboard/con_vs_pro/con_vs_pro.service';
import { ConVsProController } from './dashboard/con_vs_pro/con_vs_pro.controller';
import { ConVsProModule } from './dashboard/con_vs_pro/con_vs_pro.module';
import { TrendsModule } from './trends/trends.module';
import { EnergyCostModule } from './energy-cost/energy-cost.module';
import { EnergyUsageModule } from './energy-usage/energy-usage.module';
import { EnergyModule } from './dashboard/energy/energy.module';
import { DiagramController } from './diagram/diagram.controller';
import { DiagramService } from './diagram/diagram.service';
import { DiagramModule } from './diagram/diagram.module';
import { GenerationModule } from './dashboard/generation/generation.module';
import { AlarmsModule } from './alarms/alarms.module';
import { PieChartModule } from './dashboard/pie_chart/pie_chart.module';
import { BellModule } from './alarms/bell/bell.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './role/role.module';
import { PrivilegesModule } from './privileges/privileges.module';





@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot('mongodb://admin:cisco123@13.234.241.103:27017/iotdb?authSource=iotdb'), // First connection (iotdb)
    MongooseModule.forRoot('mongodb://localhost:27017/Prime_Cold_Alarms', {
      connectionName: 'Prime_Cold_Alarms',
     

    }),
    MongooseModule.forRoot('mongodb://localhost:27017/prime_cold', {
      connectionName: 'prime_cold',

    }),

    DashboardModule,
    SolarModule,
    GensetModule,
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
    PrivilegesModule

   
  ],
  controllers: [AppController, SolarController, ConVsProController, DiagramController],
  providers: [AppService, SolarService, ConVsProService, DiagramService],
})
export class AppModule {}



