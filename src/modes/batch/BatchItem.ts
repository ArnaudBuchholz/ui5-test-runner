export interface IBatchItem {
  readonly path: string;
  readonly id: string;
  readonly label: string;
  readonly args: string[];
  start?: Date;
  end?: Date;
  statusCode?: number;
}
