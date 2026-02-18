import { Controller, Get } from '@nestjs/common';
import { Authorization } from '@/auth/presentation/decorators/authorization.decorator';
import { UserRole } from '@db/__generated__/enums';
import { HealthCheckService } from '@/health-check/health-check.service';
import { IAllHealthCheckResponse } from '@/health-check/libs/interfaces/all-helth-check.interface';
import statusStrVal from '@/health-check/libs/invertStatus';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Authorization(UserRole.ADMIN)
@Controller('health')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @ApiOperation({ summary: 'Get redis health status' })
  @ApiResponse({ status: 200, description: "Return 'OK' | 'ERROR'" })
  @Get('redis')
  async check() {
    const result = await this.healthCheckService.redis();

    return statusStrVal(result);
  }

  @ApiOperation({ summary: 'Get Data Base health status' })
  @ApiResponse({ status: 200, description: "Return 'OK' | 'ERROR'" })
  @Get('db')
  async database() {
    const result = await this.healthCheckService.database();

    return statusStrVal(result);
  }

  @ApiOperation({ summary: 'Get mailer health status' })
  @ApiResponse({ status: 200, description: "Return 'OK' | 'ERROR'" })
  @Get('mailer')
  async mailer() {
    const result = await this.healthCheckService.mailer();

    return statusStrVal(result);
  }

  @ApiOperation({ summary: 'Get global health status' })
  @ApiResponse({ status: 200, description: 'Return list of statuses' })
  @Get('')
  async all(): Promise<IAllHealthCheckResponse> {
    return await this.healthCheckService.all();
  }
}
