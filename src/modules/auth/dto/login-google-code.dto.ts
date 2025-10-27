import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class LoginGoogleCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  redirectUri: string;
}
