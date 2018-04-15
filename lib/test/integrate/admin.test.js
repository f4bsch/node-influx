"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
describe('administrative actions', () => {
    let db;
    beforeEach(() => {
        return helpers_1.newClient().then(client => (db = client));
    });
    describe('users', () => {
        const expectUser = (name, admin) => {
            return db
                .getUsers()
                .then(users => chai_1.expect(users).to.deep.equal([{ user: name, admin }]))
                .then(() => undefined);
        };
        beforeEach(() => db.createUser('connor', 'foo', false));
        afterEach(() => db.dropUser('connor').catch(() => {
            /* noop */
        }));
        it('creates users', () => expectUser('connor', false));
        it('grants admin privs', () => {
            return db.grantAdminPrivilege('connor').then(() => expectUser('connor', true));
        });
        it('revokes admin privs', () => {
            return db
                .grantAdminPrivilege('connor')
                .then(() => db.revokeAdminPrivilege('connor'))
                .then(() => expectUser('connor', false));
        });
        it('grants specific privs', () => {
            return db.grantPrivilege('connor', 'READ'); // should not reject
        });
        it('drops users', () => {
            return db
                .dropUser('connor')
                .then(() => db.getUsers())
                .then(users => chai_1.expect(users.map(u => u.user)).not.to.contain('connor'));
        });
    });
    describe('retention policies', () => {
        const expectPolicy = (policy) => {
            return db
                .showRetentionPolicies()
                .then(rps => chai_1.expect(rps.find(p => p.name === policy.name)).to.deep.equal(policy))
                .then(() => undefined);
        };
        beforeEach(() => {
            return db.createRetentionPolicy('7d', {
                duration: '7d',
                replication: 1,
            });
        });
        afterEach(() => db.dropRetentionPolicy('7d').catch(() => {
            /* noop */
        }));
        it('creates policies', () => {
            return expectPolicy({
                default: false,
                duration: '168h0m0s',
                name: '7d',
                replicaN: 1,
                shardGroupDuration: '24h0m0s',
            });
        });
        it('alters policies', () => {
            return db
                .alterRetentionPolicy('7d', {
                duration: '7d',
                replication: 1,
                isDefault: true,
            })
                .then(() => {
                return expectPolicy({
                    default: true,
                    duration: '168h0m0s',
                    name: '7d',
                    replicaN: 1,
                    shardGroupDuration: '24h0m0s',
                });
            });
        });
        it('drops policies', () => {
            return db
                .dropRetentionPolicy('7d')
                .then(() => db.showRetentionPolicies())
                .then(rps => chai_1.expect(rps.map(rp => rp.name)).to.not.contain('7d'));
        });
    });
    describe('continuous queries', () => {
        const sampleQuery = 'SELECT MEAN(cpu) INTO "7d"."perf" FROM "1d"."perf" GROUP BY time(1m)';
        beforeEach(() => {
            return Promise.all([
                db.createRetentionPolicy('7d', {
                    duration: '7d',
                    replication: 1,
                }),
                db.createRetentionPolicy('1d', {
                    duration: '1d',
                    replication: 1,
                }),
            ]);
        });
        afterEach(() => {
            return Promise.all([
                db.dropRetentionPolicy('7d'),
                db.dropRetentionPolicy('1d'),
                db.dropContinuousQuery('7d_perf').catch(() => {
                    /* noop */
                }),
            ]);
        });
        it('creates continuous queries', () => {
            return db
                .createContinuousQuery('7d_perf', sampleQuery)
                .then(() => db.showContinousQueries())
                .then(queries => {
                chai_1.expect(queries.slice()).to.deep.equal([
                    {
                        name: '7d_perf',
                        query: 'CREATE CONTINUOUS QUERY "7d_perf" ON ' +
                            'influx_test_db BEGIN SELECT mean(cpu) INTO influx_test_db."7d".perf ' +
                            'FROM influx_test_db."1d".perf GROUP BY time(1m) END',
                    },
                ]);
            });
        });
        it('drops continuous queries', () => {
            return db
                .createContinuousQuery('7d_perf', sampleQuery)
                .then(() => db.showContinousQueries())
                .then(() => db.dropContinuousQuery('7d_perf'))
                .then(() => db.showContinousQueries())
                .then(queries => chai_1.expect(queries).to.have.length(0));
        });
    });
});
