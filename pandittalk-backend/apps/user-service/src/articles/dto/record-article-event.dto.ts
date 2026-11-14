import { ArticleEventSource, ArticleEventType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class RecordArticleEventDto {
  @IsEnum(ArticleEventType)
  type!: ArticleEventType;

  @IsEnum(ArticleEventSource)
  source!: ArticleEventSource;
}
