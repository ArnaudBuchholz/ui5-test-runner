import { punyexpr } from 'punyexpr';
import type { Configuration } from './Configuration.js';
import { indexedOptions } from './indexedOptions.js';
import { OptionValidationError } from './OptionValidationError.js';

export const validations: Array<(configuration: Configuration) => void> = [
  (configuration) => {
    if (
      Object.hasOwn(configuration, 'coverage') &&
      !punyexpr("(!coverage || webapp !== '' || coverageSourceDir !== '')")(configuration)
    ) {
      throw OptionValidationError.createValidationError(
        indexedOptions.coverage,
        'at least one of webapp or coverageSourceDir must be set'
      );
    }
  },
  (configuration) => {
    if (Object.hasOwn(configuration, 'dumpConfig') && !punyexpr("(mode === 'dumpConfig')")(configuration)) {
      throw OptionValidationError.createValidationError(
        indexedOptions.dumpConfig,
        'this option cannot be combined with other mode options'
      );
    }
  },
  (configuration) => {
    if (Object.hasOwn(configuration, 'help') && !punyexpr("(mode === 'help')")(configuration)) {
      throw OptionValidationError.createValidationError(
        indexedOptions.help,
        'this option cannot be combined with other mode options'
      );
    }
  },
  (configuration) => {
    if (Object.hasOwn(configuration, 'log') && !punyexpr("(mode === 'log')")(configuration)) {
      throw OptionValidationError.createValidationError(
        indexedOptions.log,
        'this option cannot be combined with other mode options'
      );
    }
  },
  (configuration) => {
    if (Object.hasOwn(configuration, 'logDump') && !punyexpr('(log !== undefined)')(configuration)) {
      throw OptionValidationError.createValidationError(indexedOptions.logDump, 'requires log');
    }
  },
  (configuration) => {
    if (
      Object.hasOwn(configuration, 'logFilter') &&
      !punyexpr('(log !== undefined) && (logDump !== undefined)')(configuration)
    ) {
      throw OptionValidationError.createValidationError(indexedOptions.logFilter, 'requires log and logDump');
    }
  },
  (configuration) => {
    if (
      Object.hasOwn(configuration, 'startTimeout') &&
      !punyexpr('(start !== undefined) && (startWaitUrl !== undefined)')(configuration)
    ) {
      throw OptionValidationError.createValidationError(indexedOptions.startTimeout, 'requires start and startWaitUrl');
    }
  },
  (configuration) => {
    if (
      Object.hasOwn(configuration, 'startWaitMethod') &&
      !punyexpr('(start !== undefined) && (startWaitUrl !== undefined)')(configuration)
    ) {
      throw OptionValidationError.createValidationError(
        indexedOptions.startWaitMethod,
        'requires start and startWaitUrl'
      );
    }
  },
  (configuration) => {
    if (Object.hasOwn(configuration, 'startWaitUrl') && !punyexpr('(start !== undefined)')(configuration)) {
      throw OptionValidationError.createValidationError(indexedOptions.startWaitUrl, 'requires start');
    }
  },
  (configuration) => {
    if (Object.hasOwn(configuration, 'version') && !punyexpr("(mode === 'version')")(configuration)) {
      throw OptionValidationError.createValidationError(
        indexedOptions.version,
        'this option cannot be combined with other mode options'
      );
    }
  }
];
