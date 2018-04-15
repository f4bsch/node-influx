import { InfluxDB } from '../../src';
export declare const db: string;
export declare function newClient(): Promise<InfluxDB>;
export declare function writeSampleData(client: InfluxDB): Promise<void>;
