export interface MicroserviceMessage<T = unknown> {
  correlationId: string;
  payload: T;
}
