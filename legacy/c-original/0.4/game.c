#include "game.h"
#include "globals.h"
#include "stdlib.h"

void
game_init()
{
	unsigned PitCount;
	unsigned Row, Col;
	unsigned r;
	unsigned VertThird;
	unsigned HorizHalf;

	// Place Player
	gPlayerRow = 0;
	gPlayerCol = 0;

	// Place guaranteed path
	HorizHalf = GRID_W / 2;
	VertThird = GRID_H / 3;
	for(Row = 0; Row < VertThird; Row++)
	{
		gGrid[Row][0] = PATH;
		gGrid[Row][HorizHalf] = PATH;
		gGrid[Row][GRID_W - 2] = PATH;

		gGrid[GRID_H - 1 - Row][0] = PATH;
		gGrid[GRID_H - 1 - Row][HorizHalf] = PATH;
		gGrid[GRID_H - 1 - Row][GRID_W - 2] = PATH;
	}
	for(Row = (VertThird - 1); Row < (VertThird + VertThird + 1); Row++)
	{
		gGrid[Row][1] = PATH;
		gGrid[Row][HorizHalf + 1] = PATH;
		gGrid[Row][GRID_W - 1] = PATH;
	}
	for(Col = 0; Col < HorizHalf; Col++)
	{
		gGrid[GRID_H - 1][Col] = PATH;
	}
	for(Col = HorizHalf; Col < GRID_W - 1; Col++)
	{
		gGrid[0][Col] = PATH;
	}

	// Place finish
	gGrid[GRID_H - 1][GRID_W - 1] = FINISH;

	// Place pits
	PitCount = 0;
	while(PitCount < PITS)
	{
		r = rand() % (GRID_H * GRID_W);
		
		Row = r / GRID_W;
		Col = r % GRID_W;

		if(gGrid[Row][Col] == GRASS)
		{
			gGrid[Row][Col] = PIT;
			PitCount++;
		}
	}

	gGameState = PLAYING;
}

void
game_main()
{
	// Can't move with the lights on
	if(gbLights)
	{
		goto done;
	}

	// Move
	switch(gMovement)
	{
		case NORTH:
			if(gPlayerRow > 0)
			{
				gPlayerRow--;
			}
			break;
		case SOUTH:
			if(gPlayerRow < GRID_H - 1)
			{
				gPlayerRow++;
			}
			break;
		case EAST:
			if(gPlayerCol < GRID_W - 1)
			{
				gPlayerCol++;
			}
			break;
		case WEST:
			if(gPlayerCol > 0)
			{
				gPlayerCol--;
			}
			break;
		default:
			goto done;
	}

	gbRedraw = TRUE;
	
	//check for pit
	if(gGrid[gPlayerRow][gPlayerCol] == PIT)
	{
		gGameState = DEAD;
	}

	//check for end
	if(gGrid[gPlayerRow][gPlayerCol] == FINISH)
	{
		gGameState = WON;
	}

done:

	gMovement = NONE;
	return;
}
