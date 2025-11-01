// src/energy/dto/energy-query.dto.ts
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class EnergyKWHDto {
    @IsArray()
    @IsNotEmpty()
    meterId: string[];

    @IsString()
    @IsNotEmpty()
    startDate: string;

    @IsString()
    @IsNotEmpty()
    endDate: string;
}