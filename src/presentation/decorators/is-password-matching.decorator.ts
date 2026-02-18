import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { RegisterDto } from '@/auth/presentation/dto/register.dto';

@ValidatorConstraint({ name: 'IsPasswordsMatching', async: false })
export class IsPasswordsMatching implements ValidatorConstraintInterface {
  validate(
    passwordRepeat: string,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    const obj = validationArguments?.object as RegisterDto;
    return obj.password === passwordRepeat;
  }

  defaultMessage?(_?: ValidationArguments): string {
    return 'The passwords mismatching.';
  }
}
