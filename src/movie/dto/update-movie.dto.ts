import {
  IsNotEmpty,
  IsOptional,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// @ValidatorConstraint({
//   async: true, // validator를 비동기적으로 실행 가능
// })
// class PasswordValidator implements ValidatorConstraintInterface {
//   // 유효성 검사를 수행하는 메서드
//   validate(
//     value: any, // 검사할 값
//     validationArguments?: ValidationArguments, // 유효성 검사 시 추가로 전달되는 정보
//   ): Promise<boolean> | boolean {
//     // 비밀번호 길이는 4~8자
//     return value.length >= 4 && value.length <= 8;
//   }

//   // 유효성 검사가 실패했을 때 반환할 메시지
//   defaultMessage(validationArguments?: ValidationArguments): string {
//     return '비밀번호는 4~8자여야 합니다. 입력된 비밀번호: $value';
//   }
// }

// function IsPasswordValid(validateOptions?: ValidationOptions) {
//   return function (object: Object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName,
//       options: validateOptions,
//       validator: PasswordValidator, // 우리가 생성한 validator 추가
//     });
//   };
// }

export class UpdateMovieDto {
  // 필드가 존재할 경우, 해당 필드가 비어있지 않아야 한다.
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  // @Validate(PasswordValidator)
  // @IsPasswordValid()
  // test: string;
}
