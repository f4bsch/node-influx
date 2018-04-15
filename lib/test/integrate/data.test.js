"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
describe('data operations', () => {
    let db;
    beforeEach(() => {
        return helpers_1.newClient()
            .then(client => (db = client))
            .then(() => helpers_1.writeSampleData(db));
    });
    it('shows databases', () => {
        return db.getDatabaseNames().then(res => chai_1.expect(res).contain('influx_test_db'));
    });
    it('writes complex values (issue #242)', () => {
        const original = JSON.stringify({ a: JSON.stringify({ b: 'c c' }) });
        return db.writeMeasurement('complex_value_series', [{ fields: { msg: original } }]);
    });
    it('lists measurements', () => {
        return db.getMeasurements().then(res => {
            chai_1.expect(res).to.deep.equal(['h2o_feet', 'h2o_quality']);
        });
    });
    it('lists series', () => {
        return db.getSeries().then(res => {
            chai_1.expect(res).to.deep.equal([
                'h2o_feet,location=coyote_creek',
                'h2o_feet,location=santa_monica',
                'h2o_quality,location=coyote_creek,randtag=1',
                'h2o_quality,location=coyote_creek,randtag=2',
                'h2o_quality,location=coyote_creek,randtag=3',
            ]);
        });
    });
    it('drops series', () => {
        return db
            .dropSeries({
            where: e => e.tag('randtag').equals.value('1'),
            measurement: 'h2o_quality',
        })
            .then(() => db.getSeries())
            .then(res => chai_1.expect(res).to.not.contain('h2o_quality,location=coyote_creek,randtag=1'));
    });
    it('gets measurements', () => {
        return db.getMeasurements().then(res => chai_1.expect(res).to.deep.equal(['h2o_feet', 'h2o_quality']));
    });
    it('drops measurement', () => {
        return db
            .dropMeasurement('h2o_feet')
            .then(() => db.getMeasurements())
            .then(res => chai_1.expect(res).to.not.contain('h2o_feet'));
    });
});
