#ifndef _CLM_GLOBALS_
#define _CLM_GLOBALS_

#define GRID_H 10
#define GRID_W 10
#define PITS 20

typedef enum
{
	GRASS,
	PIT,
	START,
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

extern unsigned gAaronRow;
extern unsigned gAaronCol;

void
globals_init();

#endif
