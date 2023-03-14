import { Model } from 'sequelize-typescript';
export declare class CasbinRule extends Model<CasbinRule> {
    ptype: string;
    v0: string;
    v1: string;
    v2: string;
    v3: string;
    v4: string;
    v5: string;
}
export declare function updateCasbinRule(tableName?: string, schema?: string): void;
