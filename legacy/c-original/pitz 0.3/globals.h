#ifndef _CLM_GLOBALS_
#define _CLM_GLOBALS_

#include <stdio.h>

#define GRID_H 15
#define GRID_W 15
#define PITS 45

typedef enum
{
	GRASS,
	PIT,
	PATH,
	FINISH
} CELL;

typedef enum
{
	PLAYING,
	DEAD,
	WON,
	QUIT
} GAME_STATE;

typedef enum
{
	NORTH,
	SOUTH,
	EAST,
	WEST,
	NONE
} DIRECTION;

typedef enum
{
	FALSE = 0,
	TRUE
} BOOL;

extern unsigned gScreenW;
extern unsigned gScreenH;

extern CELL gGrid[GRID_H][GRID_W];

extern GAME_STATE gGameState;

extern DIRECTION gMovement;

extern BOOL gbRedraw;
extern BOOL gbLights;

extern unsigned gAaronRow;
extern unsigned gAaronCol;

void
globals_init();

#endif
