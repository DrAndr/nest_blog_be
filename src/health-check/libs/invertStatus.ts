import { StatusEnum } from '@/health-check/libs/enums/status.enum';

export default function statusStrVal(status: boolean): StatusEnum {
  return status ? StatusEnum.OK : StatusEnum.ERROR;
}
