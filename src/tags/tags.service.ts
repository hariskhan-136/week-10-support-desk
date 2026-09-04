import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tag } from './tags.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async findAll() {
    return this.tagsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async create(name: string) {
    const existingTag = await this.tagsRepository.findOne({
      where: { name },
    });

    if (existingTag) {
      throw new ConflictException('Tag already exists');
    }

    const tag = this.tagsRepository.create({ name });

    return this.tagsRepository.save(tag);
  }
}
