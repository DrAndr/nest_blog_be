import { StatusEnum } from '@/health-check/libs/enums/status.enum';

export interface IAllHealthCheckResponse {
  database: StatusEnum;
  redis: StatusEnum;
  mailer: StatusEnum;
}
