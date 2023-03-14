"use strict";
// Copyright 2018 The Casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeAdapter = void 0;
const casbin_1 = require("casbin");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const casbinRule_1 = require("./casbinRule");
/**
 * SequelizeAdapter represents the Sequelize adapter for policy storage.
 */
class SequelizeAdapter {
    constructor(option, autoCreateTable = true) {
        this.filtered = false;
        this.autoCreateTable = true;
        this.option = option;
        this.autoCreateTable = autoCreateTable;
    }
    isFiltered() {
        return this.filtered;
    }
    enabledFiltered(enabled) {
        this.filtered = enabled;
    }
    /**
     * newAdapter is the constructor.
     * @param option sequelize connection option
     */
    static newAdapter(option, autoCreateTable) {
        return __awaiter(this, void 0, void 0, function* () {
            const a = new SequelizeAdapter(option, autoCreateTable);
            yield a.open();
            return a;
        });
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            this.sequelize = new sequelize_typescript_1.Sequelize(this.option);
            casbinRule_1.updateCasbinRule(this.option.tableName);
            yield this.sequelize.authenticate();
            this.sequelize.addModels([casbinRule_1.CasbinRule]);
            if (this.autoCreateTable) {
                yield this.createTable();
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sequelize.close();
        });
    }
    createTable() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sequelize.sync();
        });
    }
    loadPolicyLine(line, model) {
        const result = line.ptype +
            ', ' +
            [line.v0, line.v1, line.v2, line.v3, line.v4, line.v5]
                .filter((n) => n)
                .join(', ');
        casbin_1.Helper.loadPolicyLine(result, model);
    }
    /**
     * loadPolicy loads all policy rules from the storage.
     */
    loadPolicy(model) {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = yield this.sequelize.getRepository(casbinRule_1.CasbinRule).findAll();
            for (const line of lines) {
                this.loadPolicyLine(line, model);
            }
        });
    }
    savePolicyLine(ptype, rule) {
        const line = new casbinRule_1.CasbinRule();
        line.ptype = ptype;
        if (rule.length > 0) {
            line.v0 = rule[0];
        }
        if (rule.length > 1) {
            line.v1 = rule[1];
        }
        if (rule.length > 2) {
            line.v2 = rule[2];
        }
        if (rule.length > 3) {
            line.v3 = rule[3];
        }
        if (rule.length > 4) {
            line.v4 = rule[4];
        }
        if (rule.length > 5) {
            line.v5 = rule[5];
        }
        return line;
    }
    /**
     * savePolicy saves all policy rules to the storage.
     */
    savePolicy(model) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sequelize.transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // truncate casbin table
                yield this.sequelize
                    .getRepository(casbinRule_1.CasbinRule)
                    .destroy({ where: {}, truncate: true, transaction: tx });
                const lines = [];
                let astMap = model.model.get('p');
                for (const [ptype, ast] of astMap) {
                    for (const rule of ast.policy) {
                        const line = this.savePolicyLine(ptype, rule);
                        lines.push(line);
                    }
                }
                astMap = model.model.get('g');
                for (const [ptype, ast] of astMap) {
                    for (const rule of ast.policy) {
                        const line = this.savePolicyLine(ptype, rule);
                        lines.push(line);
                    }
                }
                yield casbinRule_1.CasbinRule.bulkCreate(lines.map((l) => l.get({ plain: true })), { transaction: tx });
            }));
            return true;
        });
    }
    /**
     * addPolicy adds a policy rule to the storage.
     */
    addPolicy(sec, ptype, rule) {
        return __awaiter(this, void 0, void 0, function* () {
            const line = this.savePolicyLine(ptype, rule);
            yield line.save();
        });
    }
    /**
     * addPolicies adds a policyList rules to the storage.
     */
    addPolicies(sec, ptype, rules) {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = [];
            for (const rule of rules) {
                const line = this.savePolicyLine(ptype, rule);
                lines.push(line);
            }
            yield this.sequelize.transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                yield casbinRule_1.CasbinRule.bulkCreate(lines.map((l) => l.get({ plain: true })), { transaction: tx });
            }));
        });
    }
    /**
     * removePolicies removes a policyList rule from the storage.
     */
    removePolicy(sec, ptype, rule) {
        return __awaiter(this, void 0, void 0, function* () {
            const line = this.savePolicyLine(ptype, rule);
            const where = {};
            Object.keys(line.get({ plain: true }))
                .filter((key) => key !== 'id')
                .forEach((key) => {
                // @ts-ignore
                where[key] = line[key];
            });
            yield this.sequelize.getRepository(casbinRule_1.CasbinRule).destroy({ where });
        });
    }
    /**
     * removePolicies removes a policyList rule from the storage.
     */
    removePolicies(sec, ptype, rules) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sequelize.transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                for (const rule of rules) {
                    const line = this.savePolicyLine(ptype, rule);
                    const where = {};
                    Object.keys(line.get({ plain: true }))
                        .filter((key) => key !== 'id')
                        .forEach((key) => {
                        // @ts-ignore
                        where[key] = line[key];
                    });
                    yield this.sequelize
                        .getRepository(casbinRule_1.CasbinRule)
                        .destroy({ where, transaction: tx });
                }
            }));
        });
    }
    /**
     * loadFilteredPolicy loads policy rules that match the filter from the storage;
     * use an empty string for selecting all values in a certain field.
     */
    loadFilteredPolicy(model, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereStatements = Object.keys(filter).map((ptype) => {
                const policyPatterns = filter[ptype];
                return policyPatterns.map((policyPattern) => {
                    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ ptype }, (policyPattern[0] && { v0: policyPattern[0] })), (policyPattern[1] && { v1: policyPattern[1] })), (policyPattern[2] && { v2: policyPattern[2] })), (policyPattern[3] && { v3: policyPattern[3] })), (policyPattern[4] && { v4: policyPattern[4] })), (policyPattern[5] && { v5: policyPattern[5] }));
                });
            });
            const where = {
                [sequelize_1.Op.or]: whereStatements.reduce((accumulator, value) => accumulator.concat(value), []),
            };
            const lines = yield this.sequelize
                .getRepository(casbinRule_1.CasbinRule)
                .findAll({ where });
            lines.forEach((line) => this.loadPolicyLine(line, model));
            this.enabledFiltered(true);
        });
    }
    /**
     * removeFilteredPolicy removes policy rules that match the filter from the storage.
     */
    removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues) {
        return __awaiter(this, void 0, void 0, function* () {
            const line = new casbinRule_1.CasbinRule();
            line.ptype = ptype;
            const idx = fieldIndex + fieldValues.length;
            if (fieldIndex <= 0 && 0 < idx) {
                line.v0 = fieldValues[0 - fieldIndex];
            }
            if (fieldIndex <= 1 && 1 < idx) {
                line.v1 = fieldValues[1 - fieldIndex];
            }
            if (fieldIndex <= 2 && 2 < idx) {
                line.v2 = fieldValues[2 - fieldIndex];
            }
            if (fieldIndex <= 3 && 3 < idx) {
                line.v3 = fieldValues[3 - fieldIndex];
            }
            if (fieldIndex <= 4 && 4 < idx) {
                line.v4 = fieldValues[4 - fieldIndex];
            }
            if (fieldIndex <= 5 && 5 < idx) {
                line.v5 = fieldValues[5 - fieldIndex];
            }
            const where = {};
            Object.keys(line.get({ plain: true }))
                .filter((key) => key !== 'id')
                .forEach((key) => {
                // @ts-ignore
                where[key] = line[key];
            });
            yield this.sequelize.getRepository(casbinRule_1.CasbinRule).destroy({
                where,
            });
        });
    }
}
exports.SequelizeAdapter = SequelizeAdapter;
