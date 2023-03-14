import { Adapter, Model } from 'casbin';
import { SequelizeOptions } from 'sequelize-typescript';
export interface SequelizeAdapterOptions extends SequelizeOptions {
    tableName?: string;
    schema?: string;
}
/**
 * SequelizeAdapter represents the Sequelize adapter for policy storage.
 */
export declare class SequelizeAdapter implements Adapter {
    private readonly option;
    private sequelize;
    private filtered;
    private autoCreateTable;
    constructor(option: SequelizeAdapterOptions, autoCreateTable?: boolean);
    isFiltered(): boolean;
    enabledFiltered(enabled: boolean): void;
    /**
     * newAdapter is the constructor.
     * @param option sequelize connection option
     */
    static newAdapter(option: SequelizeAdapterOptions, autoCreateTable?: boolean): Promise<SequelizeAdapter>;
    private open;
    close(): Promise<void>;
    private createTable;
    private loadPolicyLine;
    /**
     * loadPolicy loads all policy rules from the storage.
     */
    loadPolicy(model: Model): Promise<void>;
    private savePolicyLine;
    /**
     * savePolicy saves all policy rules to the storage.
     */
    savePolicy(model: Model): Promise<boolean>;
    /**
     * addPolicy adds a policy rule to the storage.
     */
    addPolicy(sec: string, ptype: string, rule: string[]): Promise<void>;
    /**
     * addPolicies adds a policyList rules to the storage.
     */
    addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void>;
    /**
     * removePolicies removes a policyList rule from the storage.
     */
    removePolicy(sec: string, ptype: string, rule: string[]): Promise<void>;
    /**
     * removePolicies removes a policyList rule from the storage.
     */
    removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void>;
    /**
     * loadFilteredPolicy loads policy rules that match the filter from the storage;
     * use an empty string for selecting all values in a certain field.
     */
    loadFilteredPolicy(model: Model, filter: {
        [key: string]: string[][];
    }): Promise<void>;
    /**
     * removeFilteredPolicy removes policy rules that match the filter from the storage.
     */
    removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void>;
}
