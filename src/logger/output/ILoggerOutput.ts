export interface ILoggerOutput {
  appendToLoggerOutput(lines: string): void;
  closeLoggerOutput(): void;
}
