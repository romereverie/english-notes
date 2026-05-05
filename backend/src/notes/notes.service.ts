import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async getNotes() {
    return this.prisma.note.findMany();
  }

  async createNote(note: any) {
    return this.prisma.note.create({
      data: note,
    });
  }

  async deleteNote(id: number) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }

    await this.prisma.note.delete({
      where: { id },
    });

    return {
      deleted: true,
      id,
    };
  }

  async updateNote(id: number, updatedNote: UpdateNoteDto) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }

    return this.prisma.note.update({
      where: { id },
      data: updatedNote,
    });
  }
}