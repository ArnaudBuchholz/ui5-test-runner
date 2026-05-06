export interface IError {
  name: string;
  message: string;
  stack?: string;
  cause?: IError;
  errors?: IError[];
}
