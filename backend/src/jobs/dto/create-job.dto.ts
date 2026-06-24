import { ArrayMinSize, IsArray, IsString, IsUrl } from 'class-validator';

export class CreateJobDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  urls!: string[];
}
