import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Put,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
type AuthRequest = { user: { userId: number } };
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}
  @Get() getNotes(@Req() req: AuthRequest) {
    return this.notesService.getNotes(req.user.userId);
  }
  @Get(':id') getNote(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notesService.getNote(req.user.userId, id);
  }
  @Post() createNote(@Req() req: AuthRequest, @Body() body: CreateNoteDto) {
    return this.notesService.createNote(req.user.userId, body);
  }
  @Delete(':id') deleteNote(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notesService.deleteNote(req.user.userId, id);
  }
  @Put(':id') updateNote(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(req.user.userId, id, body);
  }
}
