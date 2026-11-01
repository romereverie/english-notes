import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}
  getNotes(userId: number) {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }
  async getNote(userId: number, id: number) {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }
  createNote(userId: number, note: CreateNoteDto) {
    return this.prisma.note.create({
      data: { title: note.title, content: note.content ?? '', userId },
    });
  }
  async updateNote(userId: number, id: number, note: UpdateNoteDto) {
    const result = await this.prisma.note.updateMany({
      where: { id, userId },
      data: { title: note.title, content: note.content },
    });
    if (!result.count) throw new NotFoundException('Note not found');
    return this.getNote(userId, id);
  }
  async deleteNote(userId: number, id: number) {
    const result = await this.prisma.note.deleteMany({ where: { id, userId } });
    if (!result.count) throw new NotFoundException('Note not found');
    return { deleted: true, id };
  }
}
