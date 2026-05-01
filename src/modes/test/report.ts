import { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';
import { version } from '../../platform/version.js';

export const reportBuilder = new TestReportBuilder(crypto.randomUUID(), await version());
