import { Controller, Get, Post, Body, Delete, Param, Put } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  getNotes() {
    return this.notesService.getNotes();
  }

  @Post()
  createNote(@Body() body: CreateNoteDto) {
    return this.notesService.createNote(body);
  }

  @Delete(':id')
  deleteNote(@Param('id') id: string) {
  return this.notesService.deleteNote(Number(id));
}
  
  @Put(':id')
  updateNote(@Param('id') id: string, @Body() body: UpdateNoteDto) {
  return this.notesService.updateNote(Number(id), body);
}
}
