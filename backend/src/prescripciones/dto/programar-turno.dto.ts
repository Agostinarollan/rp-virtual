import { IsDateString, IsInt } from 'class-validator';

// Turnero de quirófano: quirófano + fecha y hora (los turnos son por hora exacta).
export class ProgramarTurnoDto {
  @IsInt({ message: 'Seleccioná un quirófano.' })
  idQuirofano: number;

  @IsDateString({}, { message: 'La fecha y hora del turno no es válida.' })
  fechaHora: string;
}
