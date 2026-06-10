#include "ui.h"
#include "game.h"
#include "globals.h"

int main(int argc, char** argv)
{
	globals_init();
	ui_init();
	game_init();
	
	while(gGameState == PLAYING)
	{
		ui_main();
		game_main();
	}
	
	return 0;
}
