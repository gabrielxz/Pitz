#include "globals.h"
#include <stdlib.h>
#include <time.h>

// Screen size
unsigned gScreenW;
unsigned gScreenH;

// The grid
CELL gGrid[GRID_H][GRID_W];

// The state
GAME_STATE gGameState;

// The last movement
DIRECTION gMovement;

// Redraw the screen?
BOOL gbRedraw;
BOOL gbLights;

// Aaron's location on the grid
unsigned gAaronRow;
unsigned gAaronCol;

void
globals_init()
{
	unsigned row;
	unsigned col;

	srand(time(0));

	gbRedraw = TRUE;
	gbLights = FALSE;

	gScreenW = 512;
	gScreenH = 512;

	for(row = 0; row < GRID_H; row++)
	{
		for(col = 0; col < GRID_W; col++)
		{
			gGrid[row][col] = GRASS;
		}
	}
}
