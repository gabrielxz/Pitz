#include "game.h"
#include "globals.h"
#include "stdlib.h"

void
game_init()
{
	unsigned PitCount;
	unsigned PitRow, PitCol;
	unsigned r;

	gAaronRow = 0;
	gAaronCol = 0;

	gGrid[gAaronRow][gAaronCol] = START;
	gGrid[GRID_H - 1][GRID_W - 1] = FINISH;

	// Place pits
	PitCount = 0;
	while(PitCount < PITS)
	{
		r = rand() % (GRID_H * GRID_W);
		
		PitRow = r / GRID_H;
		PitCol = r % GRID_W;

		if(gGrid[PitRow][PitCol] == GRASS)
		{
			gGrid[PitRow][PitCol] = PIT;
			PitCount++;
		}
	}

	gGameState = PLAYING;
}

void
game_main()
{
	// Move
	switch(gMovement)
	{
		case NORTH:
			if(gAaronRow > 0)
			{
				gAaronRow--;
			}
			break;
		case SOUTH:
			if(gAaronRow < GRID_H - 1)
			{
				gAaronRow++;
			}
			break;
		case EAST:
			if(gAaronCol < GRID_W - 1)
			{
				gAaronCol++;
			}
			break;
		case WEST:
			if(gAaronCol > 0)
			{
				gAaronCol--;
			}
			break;
		default:
			goto done;
	}

	gbRedraw = TRUE;
	gMovement = NONE;
	
	//check for pit
	if(gGrid[gAaronRow][gAaronCol] == PIT)
	{
		gGameState = DEAD;
	}

	//check for end
	if(gGrid[gAaronRow][gAaronCol] == FINISH)
	{
		gGameState = WON;
	}

done:
	return;
}
